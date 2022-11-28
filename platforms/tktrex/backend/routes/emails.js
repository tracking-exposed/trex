const nconf = require('nconf');
const debug = require('debug')('routes:emails');
const _ = require('lodash');

const mongo3 = require('@shared/providers/mongo.provider');
const security = require('../lib/security');

/*
function validateEmail(email) {
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}
*/

async function registerEmail2(req) {
  /* emails are not currently used, and the code used in yttrex it is simpler than the one in tk.
   * the piece of code should be merged in `shared` and ported in TS.
   * Eventually, registering email should be done only after having understood which kind of
   * newsletter provier we might use in the future. At the moment is not defined yet
   *
   * Previous reasons were:
   *
   * const reasons = ['subscribe-to-ukraine', 'press--list']
   *
   */
  throw new Error('Discontinued -- read the comment!');
}

async function listEmails(req) {
  if (!security.checkPassword(req)) return { status: 403 };

  const mongoc = await mongo3.clientConnect();
  const mails = await mongo3.read(mongoc, nconf.get('schema').emails);

  debug(
    'Fetched %d emails, reasons: %j',
    mails.length,
    _.countBy(mails, 'reason')
  );
  await mongoc.close();

  return { json: mails };
}

module.exports = {
  registerEmail: registerEmail2,
  listEmails,
};
