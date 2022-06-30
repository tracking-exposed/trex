const _ = require('lodash');

const debug = require('debug')('routes:events');
const nconf = require('nconf');
const moment = require('moment');

const automo = require('../lib/automo');
const utils = require('../lib/utils');
const security = require('../lib/security');

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

async function saveInDB(objects, dbcollection) {
  if (!objects.length)
    throw new Error("Internal Error: no data");

  try {
    await automo.write(dbcollection, objects);
    debug(
      'Saved %d objects in [%s] timelineId %j',
      objects.length,
      dbcollection);

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

function scheduleRun(urlo, minutesOffset, i) {
  return _.map(['ru', 'ua', 'fr', 'de', 'pl'], function(twoLetterCountryCode) {
    const runId = utils.hash({
      urlId: urlo.urlId,
      minutesOffset,
      twoLetterCountryCode
    });
    return {
      runAt: moment().add(minutesOffset, 'minutes').toISOString(),
      cc: twoLetterCountryCode,
      ...urlo,
      runId,
      state: 'waiting'
    }
  });
}

async function submitURL(req) {

  // this is necessary for the mirror functionality
  appendLast(req);

  const url = req.body.url;

  // this function has to:
  // 1) evaluate integrity and URL nature
  // 2) save in 'urls', and if new
  // 3) allocate 'runs'

  const urlId = utils.hash({url});
  debug('[+] received URL (%s)', url);

  const urlo = {
    url,
    urlId,
    savingTime: moment().toISOString()
  };

  const retv = {};
  try {
    const urlrv = await saveInDB([ urlo ], nconf.get('schema').urls);

    // this plan the tests in 1, 5 and 15 minutes (because is a test)
    const runs = _.flatten(_.map([1, 5, 15], _.partial(scheduleRun, urlo)));
    const runrv = await saveInDB(runs, nconf.get('schema').runs);
    debug("DB action results: %j %j", urlrv, runrv);
    retv.text = "Submission successful";
    retv.urlId = urlId;
    retv.success = true;
  } catch(error) {
    debug("Error in handling new URL submission: %s", error);
    retv.message = "Error";
    retv.error = error;
    retv.success = false;
    retv.urlId = urlId;
  }

  /* this is what returns to the website */
  return {
    json: retv
  };
}

module.exports = {
  submitURL,
  getMirror,
};
