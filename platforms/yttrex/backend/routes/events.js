import { geo } from '@shared/utils/ip.utils';
import { getNatureFromURL } from '@yttrex/shared/parser/parsers/nature';

const _ = require('lodash');
const debug = require('debug')('routes:events');
const nconf = require('nconf');

const { comparison } = require('./directives');
const automo = require('../lib/automo');
const utils = require('../lib/utils');
const security = require('../lib/security');

function processHeaders(received, headerList) {
  const headers = {};
  const errors = [];
  const missing = [];

  _.each(headerList, function (headInfo, headerName) {
    /* headInfo is { name: <String>, mandatory: <Bool> } */
    const h = _.get(received, headerName, undefined);
    if (!h && headInfo.mandatory === true)
      errors.push(`missing header [${headerName}, we use as ${headInfo.name}]`);
    else if (h && h.length) _.set(headers, headInfo.name, h);
    else {
      missing.push(
        `missing optional header [${headerName}], setting null [${headInfo.name}]`
      );
      _.set(headers, headInfo.name, null);
    }
  });

  if (errors.length) {
    debug('Error in processHeaders, missing: %j', errors);
    return { errors };
  }

  return headers;
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
  const MAX_STORED_CONTENT = 13;
  if (!last) last = [];
  if (_.size(last) > MAX_STORED_CONTENT) last = _.tail(last);

  last.push(_.pick(req, ['headers', 'body']));
}

const EXPECTED_HEADERS = {
  'content-length': {
    name: 'length',
    mandatory: true,
  },
  'x-yttrex-version': {
    name: 'version',
    mandatory: true,
  },
  'x-yttrex-publickey': {
    name: 'publickey',
    mandatory: true,
  },
  'x-yttrex-signature': {
    name: 'signature',
    mandatory: true,
  },
  'x-yttrex-nonauthcookieid': {
    name: 'researchTag',
    mandatory: false,
  },
  'accept-language': {
    name: 'language',
    mandatory: false,
  },
};

function extendIfExperiment(expinfo, listOf) {
  if (!expinfo) return listOf;
  debug(
    'Linking %d objects to experiment %s',
    listOf.length,
    expinfo.experimentId
  );

  const nothelpf = ['_id', 'publicKey', 'directive', 'href', 'status'];

  if (!expinfo.directive)
    // eslint-disable-next-line no-console
    console.trace('debug this %j', expinfo);

  if (!expinfo.directive) return listOf;

  debug('Valid expinfo received %j', expinfo);
  return _.map(listOf, function (o) {
    /* this function link the experiment object to the
           element found, and then rebuild the directives to
           check if the URL belong or not to the plans.
           If is does, it save it, otherwise, is activity
           made by the browser outside the directives is causes
           o.belonginn = false; */
    o.experiment = _.omit(expinfo, nothelpf);
    const steps = _.map(expinfo.directive[0].steps, comparison);
    o.experiment.directiveN = _.reduce(
      steps,
      function (memo, d, cnt) {
        if (_.isInteger(memo)) return memo;
        return d.url === o.href.replace(/\+/, '%20') ? cnt : memo;
      },
      NaN
    );
    o.experiment.directive = _.isNaN(o.experiment.directiveN)
      ? null
      : _.nth(steps, o.experiment.directiveN);
    o.experiment.belonging = !_.isNaN(o.experiment.directiveN);
    o.experiment.steps = steps;
    return o;
  });
}

async function saveInDB(experinfo, objects, dbcollection) {
  if (!objects.length)
    return { error: null, message: 'no data', subject: dbcollection };

  // this function saves leafs and htmls, and extend with exp
  const expanded = extendIfExperiment(experinfo, objects);

  /* selective debug notes based on the kind of collection we're writing on */
  let debugmarks = objects[0].researchTag
    ? JSON.stringify(_.countBy(objects, 'researchTag'))
    : '[untagged]';

  if (objects[0].experimentId)
    debugmarks += ` experimentId ${objects[0].experimentId}`;
  else debugmarks += ' !E';

  try {
    await automo.write(dbcollection, expanded);
    debug(
      'Saved %d %s metadataId %j %O %O %s',
      objects.length,
      dbcollection,
      _.uniq(_.map(objects, 'metadataId')),
      _.countBy(objects, 'nature.type'),
      _.map(objects, function (o) {
        return o.html.length;
      }),
      debugmarks
    );

    return {
      error: false,
      success: objects.length,
      subject: dbcollection,
    };
  } catch (error) {
    debug(
      'Error in saving %d %s %j (%s)',
      objects.length,
      dbcollection,
      error.message,
      debugmarks
    );
    return { error: true, message: error.message };
  }
}

async function processEvents2(req) {
  /* this function process the received payload,
   * and produce the object to be saved into mongodb */

  // appendLast enable the mirror functionality, it is
  // before any validation so we can test also submissions
  // failing the next steps
  appendLast(req);

  const headers = processHeaders(req.headers, EXPECTED_HEADERS);
  if (headers.error?.length) {
    debug(
      'processHeaders error detected: %j from headers %j',
      headers.error,
      req.headers
    );
    return {
      json: {
        status: 'error',
        info: headers.error,
      },
    };
  }

  if (!utils.verifyRequestSignature(req)) {
    debug(
      'Verification fail (signature %s) version %s',
      headers.signature,
      headers.version
    );
    return {
      json: {
        status: 'error',
        info: 'Signature does not match request body',
      },
    };
  }

  const supporter = await automo.tofu(headers.publickey, headers.version);

  // this information would be merged in htmls and leafs if exist
  const experinfo = await automo.pullExperimentInfo(supporter.publicKey);
  // experinfo is an aggregation from collection 'experiments' and
  // collection 'directives'

  const blang = headers.language
    ? headers.language.replace(/;.*/, '').replace(/,.*/, '')
    : null;

  // debug("CHECK: %s <%s>", blang, headers.language );
  const htmls = _.map(
    _.reject(_.reject(req.body, { type: 'leaf' }), { type: 'info' }),
    /* once the version 1.8.x would be in production we might gradually
     * get rid of these filters, the issue was the presence of 'info' entry
     * fail in extracting a size and more likely a collision was happening */
    function (body, i) {
      const nature = getNatureFromURL(body.href);
      const metadataId = utils.hash({
        publicKey: headers.publickey,
        randomUUID: body.randomUUID,
        href: body.href,
      });
      const id = utils.hash({
        metadataId,
        size: body.element.length,
        i,
      });
      const html = {
        id,
        metadataId,
        blang,
        href: body.href,
        publicKey: headers.publickey,
        clientTime: new Date(body.clientTime),
        savingTime: new Date(),
        html: body.element,
        counters: [body.incremental, i],
        nature,
        geoip: geo(headers['x-forwarded-for'] || req.socket.remoteAddress),
      };

      if (headers.researchTag) html.researchTag = headers.researchTag;
      if (
        body.experimentId !== undefined &&
        body.experimentId !== 'DEFAULT_UNSET'
      )
        html.experimentId = body.experimentId;

      return html;
    }
  );

  const leaves = _.map(_.filter(req.body, { type: 'leaf' }), function (e, i) {
    const nature = getNatureFromURL(e.href);
    const metadataId = utils.hash({
      publicKey: headers.publickey,
      randomUUID: e.randomUUID,
      href: e.href,
    });
    const id = utils.hash({
      metadataId,
      contentHash: e.hash,
      i,
    });

    const retelem = {
      id,
      metadataId,
      blang,
      publicKey: headers.publickey,
      ..._.omit(e, ['type', 'incremental', 'randomUUID', 'hash', 'clientTime']),
      nature,
      savingTime: new Date(),
    };
    if (headers.researchTag) retelem.researchTag = headers.researchTag;
    if (retelem.experimentId !== 'DEFAULT_UNSET')
      retelem.experimentId = e.experimentId;

    return retelem;
  });

  /* after having prepared the objects, the functions below would:
      1) extend with experiment if is not null
      2) save it in the DB and return information on the saved objects */
  const htmlrv = await saveInDB(experinfo, htmls, nconf.get('schema').htmls);
  const leafrv = await saveInDB(experinfo, leaves, nconf.get('schema').leaves);

  /* this is what returns to the web-extension */
  return {
    json: {
      status: 'OK',
      supporter,
      leaves: leafrv,
      htmls: htmlrv,
    },
  };
}

module.exports = {
  processEvents2,
  getMirror,
  processHeaders,
};
