const _ = require('lodash');
const debug = require('debug')('routes:events');
const nconf = require('nconf');

const automo = require('../lib/automo');
const utils = require('../lib/utils');
const security = require('../lib/security');
const geoip = require('geoip-lite');

const geo = (ip) => {
  const maybeLookup = geoip.lookup(ip);
  if (!maybeLookup) return null;
  const { country, city } = maybeLookup;
  return { country, city };
};

const mandatoryHeaders = {
  'content-length': 'length',
  'x-tktrex-version': 'version',
  'x-tktrex-publickey': 'publickey',
  'x-tktrex-signature': 'signature',
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
        error: error,
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

function handleFullSave(body, headers) {
  // ["html","href","feedId","feedCounter", "reason",
  //  "videoCounter","rect","clientTime","type","incremental"]
  const id = utils.hash({
    x: Math.random() + '+' + body.feedId,
  });
  const timelineId = utils.hash({
    session: body.feedId,
  });
  return {
    id,
    href: body.href,
    timelineId,
    publicKey: headers.publickey,
    version: headers.version,
    savingTime: new Date(),
    html: body.html,
    geoip: geo(headers['x-forwarded-for']),
  };
}

async function processEvents(req) {
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

  // this is necessary for the mirror functionality
  appendLast(req);

  const fullsaves = [];
  const htmls = _.compact(
    _.map(req.body, function (body, i) {
      // _.keys(body)
      // ["html","href","feedId","feedCounter",
      //  "videoCounter","rect","clientTime","type","incremental"]
      // 'type' can be ignored as it is always 'video' and doesn't reflect nature

      const id = utils.hash({
        clientRGN: body.feedId
          ? body.feedId
          : body.href + new Date().toISOString(),
        serverPRGN: supporter.publicKey,
        impressionNumber: body.videoCounter || Math.random(),
      });
      const timelineIdHash = utils.hash({
        session: body.feedId
          ? body.feedId
          : body.href + new Date().toISOString(),
      });
      const timelineWord = utils.pickFoodWord(timelineIdHash);

      // optionally there is 'reason':"fullsave" and it should
      // be collected as a different thing. it returns null
      // and append to fullsaves as side effect
      if (body.reason === 'fullsave') {
        fullsaves.push(handleFullSave(body, timelineIdHash));
        return null;
      }

      const optionalNumbers = [];
      if (_.isInteger(body.videoCounter))
        optionalNumbers.push(body.videoCounter);
      if (_.isInteger(i)) optionalNumbers.push(i);
      if (_.isInteger(body.incremental)) optionalNumbers.push(body.incremental);
      if (_.isInteger(body.feedCounter)) optionalNumbers.push(body.feedCounter);
      optionalNumbers.push(_.size(body.html));
      const html = {
        id,
        rect: body.rect,
        href: body.href,
        timelineId: timelineWord + '-' + timelineIdHash.substr(0, 10),
        publicKey: supporter.publicKey,
        savingTime: new Date(),
        html: body.html,
        n: optionalNumbers,
        geoip: geo(req.headers['x-forwarded-for'] || req.socket.remoteAddress),
      };
      return html;
    })
  );

  debug(
    '[+] (p %s) from %s saving %s',
    supporter.p,
    JSON.stringify(_.map(req.body, 'type')),
    JSON.stringify(_.map(htmls, 'n'))
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
  debug('Ignored handshake API %j', _.keys(req.body));
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
