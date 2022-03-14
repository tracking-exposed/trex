const nconf = require('nconf');
const debug = require('debug')('routes:emails');
const _ = require('lodash');

const mongo3 = require('../lib/mongo3');
const utils = require('../lib/utils');
const security = require('../lib/security');

function validateEmail(email) {
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}

async function registerEmail2(req) {
  const email = req.body.email;
  const reason = req.body.reason;
  const collection = nconf.get('schema').emails;

  if (!validateEmail(email)) {
    debug('Rejected email address %s as invalid', email);
    return { status: 403 };
  }
  const reasons = ['subscribe-to-ukraine', 'press--list'];
  if (reasons.indexOf(reason) === -1) {
    debug('Invalid reason %s not found in %j', reason, reasons);
    return { status: 403 };
  }

  const subid = utils.hash({ email, reason });

  const mongoc = await mongo3.clientConnect({ concurrency: 1 });
  const emailAlreadyExists = await mongo3.count(mongoc, collection, { subid });

  if (emailAlreadyExists === 1) {
    debug('Address %s already present', email);
    await mongoc.close();
    return { status: 201 };
  }

  await mongo3.writeOne(mongoc, collection, {
    subid,
    email,
    registeredAt: new Date(),
    reason,
  });
  debug('Registed a new subscriber %s', email);
  await mongoc.close();
  return { status: 200 };
}

async function listEmails(req) {
  if (!security.checkPassword(req)) return { status: 403 };

  const mongoc = await mongo3.clientConnect({ concurrency: 1 });
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
  registerEmail2,
  listEmails,
};
