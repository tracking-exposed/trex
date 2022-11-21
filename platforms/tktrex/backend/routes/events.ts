import { decodeOrThrowRequest } from '@shared/endpoints/helper';
import { AppError, toAppError } from '@shared/errors/AppError';
import { toValidationError } from '@shared/errors/ValidationError';
import { Supporter } from '@shared/models/Supporter';
import * as mongo from '@shared/providers/mongo.provider';
import {
  filterByCodec,
  throwEitherError,
  validateArrayByCodec,
} from '@shared/utils/fp.utils';
import { geo } from '@shared/utils/ip.utils';
import * as endpoints from '@tktrex/shared/endpoints/v2';
import {
  getHTMLId,
  getMetadataId,
  getTimelineId,
  getAPIRequestId,
} from '@tktrex/shared/helpers/uniqueId';
import { APIRequestContributionEvent } from '@tktrex/shared/models/apiRequest/APIRequestContributionEvent';
import { HTML } from '@tktrex/shared/models/http/HTML';
import { TKHeadersLC } from '@tktrex/shared/models/http/TKHeaders';
import { getNatureByHref } from '@tktrex/shared/parser/parsers/nature';
import { parseISO } from 'date-fns';
import D from 'debug';
import * as express from 'express';
import * as A from 'fp-ts/Array';
import * as E from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';
import { IncomingHttpHeaders } from 'http';
import _ from 'lodash';
import nconf from 'nconf';
import { toAPIRequest } from '../io/apiRequest.io';
import * as automo from '../lib/automo';
import { GetEventsEntity } from '../lib/entities/events.entity';
import security from '../lib/security';
import utils from '../lib/utils';

const debug = D('routes:events');

const mandatoryHeaders = {
  'content-length': 'length' as const,
  'x-tktrex-version': 'version' as const,
  'x-tktrex-publickey': 'publicKey' as const,
  'x-tktrex-signature': 'signature' as const,
  'x-tktrex-nonauthcookieid': 'researchTag' as const,
};

type MandatoryHeadersKeys = keyof typeof mandatoryHeaders;

type MandatoryHeadersValues = typeof mandatoryHeaders[MandatoryHeadersKeys];

type TKHeaders = {
  [K in MandatoryHeadersValues]: string;
};

type ProcessHeadersResult =
  | { type: 'success'; headers: TKHeaders }
  | { type: 'error'; errors: string[] };

function processHeaders(
  received: IncomingHttpHeaders,
  required: typeof mandatoryHeaders
): ProcessHeadersResult {
  const ret = {};
  const errs = _.compact(
    _.map(required, function (destkey, headerName) {
      const r = _.get(received, headerName);
      if (_.isUndefined(r)) return headerName;

      _.set(ret, destkey, r);
      return null;
    })
  );
  if (_.size(errs)) {
    debug('Error in processHeaders, missing: %j', errs);
    return { type: 'error', errors: errs };
  }
  return { type: 'success', headers: ret as TKHeaders };
}

/**
 * Decode headers from incoming request.
 *
 * @param received Incoming HTTP Headers
 * @returns Either AppError (`E.left`) or TKHeaders (`E.right`)
 */
function decodeHeaders(
  received: IncomingHttpHeaders
): E.Either<AppError, TKHeaders> {
  return pipe(
    TKHeadersLC.decode(received),
    E.map((r) => {
      return pipe(
        Object.entries(r),
        A.reduce({} as any as TKHeaders, (acc, [key, e]) => ({
          ...acc,
          [(mandatoryHeaders as any)[key]]: e,
        })),
        (headers) => {
          debug('Parsed headers %O', headers);
          return headers;
        }
      );
    }),
    E.mapLeft((e) => {
      debug('Error in processHeaders, missing: %j', e);
      return toAppError(toValidationError('Error in processHeaders', e));
    })
  );
}

let last: any = null;
function getMirror(req: express.Request): any {
  if (!security.checkPassword(req)) return security.authError;

  if (last) {
    const retval = Object(last);
    last = null;
    debug(
      'getMirror: authentication successfull, %d elements in volatile memory',
      _.size(retval)
    );
    return { json: { content: retval, elements: _.size(retval) } };
  } else debug('getMirror: auth OK, but nothing to be returned');

  return { json: { content: null } };
}
function appendLast(req: express.Request): void {
  /* this is used by getMirror, to mirror what the server is getting
   * used by developers with password */
  const MAX_STORED_CONTENT = 15;
  if (!last) last = [];
  if (_.size(last) > MAX_STORED_CONTENT) last = _.tail(last);

  last.push(_.pick(req, ['headers', 'body']));
}

type SaveInDBResult =
  | { error: false; success: number; subject: string }
  | { error: null; message: string; subject: string }
  | { error: unknown; message: string; subject: string }
  | { error: true; message: string; subject: string };

async function saveInDB(
  experinfo: any,
  objects: any[],
  dbcollection: string
): Promise<SaveInDBResult> {
  if (!objects.length)
    return { error: null, message: 'no data', subject: dbcollection };

  // this function saves every possible reported data
  // const expanded = extendIfExperiment(experinfo, objects);
  const expanded = objects;

  try {
    await automo.write(dbcollection, expanded);
    debug(
      'Saved %d [%s] timelineId %j',
      objects.length,
      dbcollection,
      _.countBy(objects, 'timelineId')
    );

    return {
      error: false,
      success: objects.length,
      subject: dbcollection,
    };
  } catch (error) {
    if (!(error instanceof Error)) {
      debug('Error in saveInDB: %s', error);
      return {
        error,
        message: 'error in saveInDB',
        subject: dbcollection,
      };
    }

    debug(
      'Error in saving %d %s %j',
      objects.length,
      dbcollection,
      error.message
    );
    return { error: true, message: error.message, subject: dbcollection };
  }
}

async function processEvents(req: express.Request): Promise<{
  json:
    | {
        supporter: Supporter;
        full: SaveInDBResult;
        htmls: SaveInDBResult;
      }
    | { status: string; info: any };
}> {
  // appendLast enable the mirror functionality, it is
  // before any validation so we can test also submissions
  // failing the next steps
  appendLast(req);

  // decode the headers - it throws when fails
  const headers = throwEitherError(decodeHeaders(_.get(req, 'headers')));

  if (!utils.verifyRequestSignature(req)) {
    debug('Verification fail (signature %s)', headers.signature);
    return {
      json: {
        status: 'error',
        info: 'Signature does not match request body',
      },
    };
  }

  const supporter = await automo.tofu(headers.publicKey, headers.version);

  const fullsaves: any[] = [];
  const htmls = _.compact(
    _.map(req.body, function (body, i) {
      /* the timelineId identify the session, it comes from the
       * feedId because it need to trust client side */
      const timelineId = getTimelineId({
        feedId: body.feedId,
        publicKey: supporter.publicKey,
        version: headers.version,
      });

      /* this check should be done here because we shouldn't
       * trust the input from client */
      const nature = throwEitherError(getNatureByHref(body.href));

      const htmlId = getHTMLId.hash({
        ...timelineId,
        feedCounter: body.feedCounter,
        videoCounter: body.videoCounter,
        incremental: body.incremental,
        href: body.href,
        nature,
      });

      const metadataId = getMetadataId.hash({
        ...timelineId,
        feedCounter: body.feedCounter,
        videoCounter: body.videoCounter,
        href: body.href,
        nature,
      });

      /* to eventually verify integrity of collection we're saving these incremental
       * numbers that might help to spot if client-side-extension are missing somethng */
      const optionalNumbers: any[] = [];
      if (_.isInteger(body.videoCounter))
        optionalNumbers.push(body.videoCounter);
      if (_.isInteger(i)) optionalNumbers.push(i);
      if (_.isInteger(body.incremental)) optionalNumbers.push(body.incremental);
      if (_.isInteger(body.feedCounter)) optionalNumbers.push(body.feedCounter);
      optionalNumbers.push(_.size(body.html));

      const geoAddress =
        req.headers['x-forwarded-for'] ?? req.socket.remoteAddress;
      const geoip =
        geoAddress !== undefined
          ? geo(geoAddress as any) ?? undefined
          : undefined;

      const html: HTML = {
        id: htmlId as any,
        metadataId,
        blang: '',
        nature,
        type: body.type,
        rect: body.rect,
        href: body.href,
        timelineId: timelineId.id,
        publicKey: supporter.publicKey,
        clientTime: parseISO(body.clientTime),
        savingTime: new Date(),
        html: body.html,
        n: optionalNumbers,
        geoip,
        selector: body.selector,
      };

      if (body.experimentId?.length) html.experimentId = body.experimentId;

      if (headers.researchTag?.length) html.researchTag = headers.researchTag;

      return html;
    })
  );

  debug(
    '[+] (p %s) %s <%s> -- %s %s',
    supporter.p,
    JSON.stringify(_.map(req.body, 'type')),
    JSON.stringify(_.map(req.body, 'href')),
    JSON.stringify(_.map(htmls, 'n')),
    htmls[0]?.researchTag ? _.countBy(htmls, 'researchTag') : '[untagged]'
  );

  /* after having prepared the objects, the functions below would:
      1) extend with experiment if is not null
      2) save it in the DB and return information on the saved objects */
  const experinfo = {}; // TODO
  const htmlrv = await saveInDB(experinfo, htmls, nconf.get('schema').htmls);
  const fullrv = await saveInDB(experinfo, fullsaves, nconf.get('schema').full);

  /* this is what returns to the web-extension */
  return {
    json: {
      status: 'Complete',
      supporter,
      full: fullrv,
      htmls: htmlrv,
    },
  };
}

async function handshake(
  req: express.Request
): Promise<{ json: { ignored: boolean } }> {
  // debug('Not implemented protocol (yet) [handshake API %j]', req.body);
  return {
    json: { ignored: true },
  };
}

async function processAPIEvents(req: express.Request): Promise<{
  json:
    | {
        supporter: Supporter;
        apiRequests: SaveInDBResult;
      }
    | { status: string; info: any };
}> {
  const headers = throwEitherError(decodeHeaders(_.get(req, 'headers')));

  if (!utils.verifyRequestSignature(req)) {
    debug('Verification fail (signature %s)', headers.signature);
    return {
      json: {
        status: 'error',
        info: 'Signature does not match request body',
      },
    };
  }

  // fetch the supporter by the given publicKey
  const supporter = await automo.tofu(headers.publicKey, headers.version);

  // we take only APIRequestEvent from payload
  const validEvents = filterByCodec(
    req.body,
    APIRequestContributionEvent.decode
  );

  const events = validEvents.map(({ payload, ...e }) => {
    /* the timelineId identify the session, it comes from the
     * feedId because it need to trust client side */
    const timelineId = getTimelineId({
      feedId: e.feedId,
      publicKey: supporter.publicKey,
      version: headers.version,
    });

    const id = getAPIRequestId.hash({
      ...timelineId,
      feedCounter: e.feedCounter,
      videoCounter: e.videoCounter,
      incremental: e.incremental,
      href: e.href,
    });

    return {
      ...e,
      id,
      payload,
      savingTime: new Date(),
      researchTag: headers.researchTag,
      publicKey: headers.publicKey,
    };
  });

  const apiRequests = await saveInDB(
    {},
    events,
    nconf.get('schema').apiRequests
  );

  debug('API requests %O', apiRequests);

  return {
    json: {
      status: 'Complete',
      supporter,
      apiRequests,
    },
  };
}

async function getAPIEvents(req: Express.Request): Promise<{ json: any }> {
  const { query } = decodeOrThrowRequest(
    endpoints.default.Public.GETAPIEvents,
    req
  );

  debug('List api requests with query %O', query);
  const { amount, skip, sort, experimentId, publicKey, researchTag } = query;

  const filter: any = {};
  const mongoc = await mongo.clientConnect({});

  if (publicKey) {
    filter.publicKey = {
      $eq: publicKey,
    };
  }

  if (experimentId) {
    filter.experimentId = {
      $eq: experimentId,
    };
  }

  if (researchTag) {
    filter.researchTag = {
      $eq: researchTag,
    };
  }

  // const supporter = await automo.tofu(query.publicKey, )

  const eventEntity = GetEventsEntity(mongoc);
  const { total, data } = await eventEntity.listAndCount({
    amount: amount ?? 20,
    skip: skip ?? 0,
    filter,
    sort,
  });

  const validData = validateArrayByCodec(data, toAPIRequest);

  await mongoc.close();

  return {
    json: { total, data: validData },
  };
}

export {
  processEvents,
  processAPIEvents,
  getMirror,
  mandatoryHeaders,
  processHeaders,
  handshake,
  getAPIEvents,
};
