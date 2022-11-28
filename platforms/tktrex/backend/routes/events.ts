import { AppError, toAppError } from '@shared/errors/AppError';
import { toValidationError } from '@shared/errors/ValidationError';
import { Supporter } from '@shared/models/Supporter';
import { filterByCodec, throwEitherError } from '@shared/utils/fp.utils';
import { geo } from '@shared/utils/ip.utils';
import {
  getAPIRequestId,
  getHTMLId,
  getMetadataId,
  getSigiStateId,
  getTimelineId,
} from '@tktrex/shared/helpers/uniqueId';
import { APIRequestType } from '@tktrex/shared/models/apiRequest';
import { ContributionEvent } from '@tktrex/shared/models/contribution';
import { HTML } from '@tktrex/shared/models/http/HTML';
import { TKHeadersLC } from '@tktrex/shared/models/http/TKHeaders';
import { SigiStateType } from '@tktrex/shared/models/sigiState/SigiState';
import { getNatureByHref } from '@tktrex/shared/parser/parsers/nature';
import { parseISO } from 'date-fns';
import D from 'debug';
import * as express from 'express';
import * as A from 'fp-ts/Array';
import * as E from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';
import { IncomingHttpHeaders } from 'http';
import { PathReporter } from 'io-ts/lib/PathReporter';
import _ from 'lodash';
import nconf from 'nconf';
import * as automo from '../lib/automo';
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
        sigiStates: SaveInDBResult;
        apiRequests: SaveInDBResult;
      }
    | { status: string; info: any };
}> {
  // appendLast enable the mirror functionality, it is
  // before any validation so we can test also submissions
  // failing the next steps
  appendLast(req);

  // decode the headers - it throws when fails
  const headers = throwEitherError(decodeHeaders(_.get(req, 'headers')));

  // console.log(req.body);
  // console.log(JSON.stringify(req.body));

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

  const events = filterByCodec(req.body, ContributionEvent.decode, (e, c) => {
    debug('Failed to parse %O', c);
    debug('Errors %O', PathReporter.report(E.left(e)));
  });

  const init = {
    htmls: [] as any[],
    apiRequests: [] as any[],
    sigiStates: [] as any[],
  };

  const { htmls, apiRequests, sigiStates } = events.reduce((acc, body, i) => {
    const event: any = {
      href: body.href,
      clientTime: parseISO(body.clientTime),
      researchTag: headers.researchTag,
      publicKey: headers.publicKey,
      savingTime: new Date(),
    };

    if (body.experimentId?.length) event.experimentId = body.experimentId;

    if (headers.researchTag?.length) event.researchTag = headers.researchTag;

    /* the timelineId identify the session, it comes from the
     * feedId because it need to trust client side */
    const timelineId = getTimelineId({
      feedId: body.feedId,
      publicKey: supporter.publicKey,
      version: headers.version,
    });

    if (APIRequestType.is(body.type)) {
      const {
        feedCounter,
        videoCounter,
        incremental,
        type,
        feedId,
        payload,
      }: any = body;
      const id = getAPIRequestId.hash({
        ...timelineId,
        feedCounter,
        videoCounter,
        incremental,
        href: body.href,
      });

      const apiEvent = {
        ...event,
        incremental,
        payload,
        feedId,
        type,
        id,
      };

      return {
        ...acc,
        apiRequests: acc.apiRequests.concat(apiEvent),
      };
    }

    if (SigiStateType.is(body.type)) {
      const { state, type }: any = body;
      const id = getSigiStateId.hash({
        timelineId: timelineId.id,
        incremental: body.incremental,
        href: body.href,
      });

      const sigiStateEvent = {
        ...event,
        type,
        state,
        id,
      };

      return {
        ...acc,
        sigiStates: acc.sigiStates.concat(sigiStateEvent),
      };
    }

    /* this check should be done here because we shouldn't
     * trust the input from client */
    const nature = throwEitherError(getNatureByHref(body.href));

    const {
      feedCounter,
      videoCounter,
      selector,
      rect,
      html: bodyHTML,
    }: any = body;
    const htmlId = getHTMLId.hash({
      ...timelineId,
      feedCounter,
      videoCounter,
      incremental: body.incremental,
      href: body.href,
      nature,
    });

    const metadataId = getMetadataId.hash({
      ...timelineId,
      feedCounter,
      videoCounter,
      href: body.href,
      nature,
    });

    /* to eventually verify integrity of collection we're saving these incremental
     * numbers that might help to spot if client-side-extension are missing somethng */
    const optionalNumbers: any[] = [];
    if (_.isInteger(body.videoCounter)) optionalNumbers.push(body.videoCounter);
    if (_.isInteger(i)) optionalNumbers.push(i);
    if (_.isInteger(body.incremental)) optionalNumbers.push(body.incremental);
    if (_.isInteger(body.feedCounter)) optionalNumbers.push(body.feedCounter);
    optionalNumbers.push(_.size(bodyHTML));

    const geoAddress =
      req.headers['x-forwarded-for'] ?? req.socket.remoteAddress;
    const geoip =
      geoAddress !== undefined
        ? geo(geoAddress as any) ?? undefined
        : undefined;

    if (selector) event.selector = selector;

    const html: HTML = {
      ...event,
      id: htmlId as any,
      metadataId,
      blang: '',
      nature,
      type: body.type,
      rect,
      href: body.href,
      timelineId: timelineId.id,
      publicKey: supporter.publicKey,
      savingTime: new Date(),
      html: bodyHTML,
      n: optionalNumbers,
      geoip,
    };

    return { ...acc, htmls: acc.htmls.concat(html) };
  }, init);

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
  const apiRequestrv = await saveInDB(
    experinfo,
    apiRequests,
    nconf.get('schema').apiRequests
  );
  const sigiStaterv = await saveInDB(
    experinfo,
    sigiStates,
    nconf.get('schema').sigiStates
  );
  const fullrv = await saveInDB(experinfo, fullsaves, nconf.get('schema').full);

  /* this is what returns to the web-extension */
  return {
    json: {
      status: 'Complete',
      supporter,
      full: fullrv,
      htmls: htmlrv,
      apiRequests: apiRequestrv,
      sigiStates: sigiStaterv,
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

export {
  processEvents,
  getMirror,
  mandatoryHeaders,
  processHeaders,
  handshake,
};
