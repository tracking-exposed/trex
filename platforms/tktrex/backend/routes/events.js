import { geo } from '@shared/utils/ip.utils';
import { parseISO } from 'date-fns';
import _ from 'lodash';
import nconf from 'nconf';
import D from 'debug';

const automo = require('../lib/automo');
const utils = require('../lib/utils');
const security = require('../lib/security');
const { getNatureByHref } = require('../parsers/shared');

const debug = D('routes:events');

const mandatoryHeaders = {
  'content-length': 'length',
  'x-tktrex-version': 'version',
  'x-tktrex-publickey': 'publickey',
  'x-tktrex-signature': 'signature',
  'x-tktrex-nonauthcookieid': 'researchTag',
};

function processHeaders(received, required) {
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
    return { errors: errs };
  }
  return ret;
}

let last = null;
function getMirror(req) {
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
function appendLast(req) {
  /* this is used by getMirror, to mirror what the server is getting
   * used by developers with password */
  const MAX_STORED_CONTENT = 15;
  if (!last) last = [];
  if (_.size(last) > MAX_STORED_CONTENT) last = _.tail(last);

  last.push(_.pick(req, ['headers', 'body']));
}

function headerError(headers) {
  debug('Error detected: %s', headers.error);
  return {
    json: {
      status: 'error',
      info: headers.error,
    },
  };
}

async function saveInDB(experinfo, objects, dbcollection) {
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
    return { error: true, message: error.message };
  }
}

async function processEvents(req) {
  // appendLast enable the mirror functionality, it is
  // before any validation so we can test also submissions
  // failing the next steps
  appendLast(req);

  const headers = processHeaders(_.get(req, 'headers'), mandatoryHeaders);
  if (headers.error) return headerError(headers);

  if (!utils.verifyRequestSignature(req)) {
    debug('Verification fail (signature %s)', headers.signature);
    return {
      json: {
        status: 'error',
        info: 'Signature does not match request body',
      },
    };
  }

  const supporter = await automo.tofu(headers.publickey, headers.version);

  const fullsaves = [];
  const htmls = _.compact(
    _.map(req.body, function (body, i) {
      /* the timelineId identify the session, it comes from the
       * feedId because it need to trust client side */
      const timelineFields = {
        session: body.feedId,
        serverPRGN: supporter.publicKey,
        version: headers.version,
      };
      const timelineIdHash = utils.hash(timelineFields);
      const timelineWord = utils.pickFoodWord(timelineIdHash);

      /* the `id` is computed by hashing specific fields. the `id` is not
       * meant to be unique, but instead, every evidence should have a different
       * ID. if a data is sent twice, we should see the duplication because the
       * ID generated is the same, and this prevents duplication */
      const idFields = {
        timelineIdHash,
        /* the timeline guarantee uniqueness by user, version, feedId */
        counters: `v(${body.videoCounter})f(${body.feedCounter})i(${body.incremental})`,
        /* the counters guarantee an increment at each evidence sent by extension */
      };

      /* this check should be done here because we shouldn't
       * trust the input from client */
      const nature = getNatureByHref(body.href);
      // console.log('[D] Nature', nature, 'Keys', _.keys(body));

      /* based on the 'body.type' we might have fields that are updated
       * (like search, profile, where the user can scroll and report larger evidences)
       * or video block in 'following' or 'foryou', with a fixed url */
      if (nature.type === 'foryou' || nature.type === 'following') {
        idFields.type = nature.type;
      } else if (nature.type === 'native') {
        idFields.n = `${nature.videoId}_${nature.authorId}`;
      } else {
        debug(`with Nature ${nature.type} using URL as seed`);
        idFields.seed = body.href;
        idFields.n = JSON.stringify(nature);
      }

      const id = utils.hash(idFields);

      /* to eventually verify integrity of collection we're saving these incremental
       * numbers that might help to spot if client-side-extension are missing somethng */
      const optionalNumbers = [];
      if (_.isInteger(body.videoCounter))
        optionalNumbers.push(body.videoCounter);
      if (_.isInteger(i)) optionalNumbers.push(i);
      if (_.isInteger(body.incremental)) optionalNumbers.push(body.incremental);
      if (_.isInteger(body.feedCounter)) optionalNumbers.push(body.feedCounter);
      optionalNumbers.push(_.size(body.html));

      const html = {
        id,
        type: body.type,
        rect: body.rect,
        href: body.href,
        timelineId: timelineWord + '-' + timelineIdHash.substring(0, 10),
        publicKey: supporter.publicKey,
        clientTime: parseISO(body.clientTime),
        savingTime: new Date(),
        html: body.html,
        n: optionalNumbers,
        geoip: geo(req.headers['x-forwarded-for'] || req.socket.remoteAddress),
        experimentId: body.experimentId,
      };

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

async function handshake(req) {
  // debug('Not implemented protocol (yet) [handshake API %j]', req.body);
  return {
    json: { ignored: true },
  };
}

async function processAPIEvents(req) {
  for (const data of req.body) {
    const { request, response, url, id } = data.payload;

    debug('received api events %s for %s', id, url);

    // request has always body: [{events:[]}]
    const events = _.get(request.body[0], 'events');
    // debug('request.events %s', JSON.stringify(events, null, 3));
    // and each event has 'event' (name) and 'params' JSON String
    const converted = _.map(events, function (o) {
      return _.set({}, o.event, JSON.parse(o.params));
    });
    debug('request.events %s', JSON.stringify(converted, null, 1));
    // converted is just simpler to read when plotted

    // response is kind of useless anytime?
    if (response.headers['content-length'] > 7)
      debug('UNUSUAL response %O', response);
  }

  return {
    json: true,
  };
}

module.exports = {
  processEvents,
  processAPIEvents,
  getMirror,
  mandatoryHeaders,
  processHeaders,
  handshake,
};
