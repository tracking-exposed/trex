const nconf = require('nconf');
const debug = require('debug')('routes:emails');

const mongo3 = require('../lib/mongo3');

function validateEmail(email) {
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}

async function registerEmail(req) {
  const email = req.body.email;
  const reason = req.body.reason;
  const collection = nconf.get('schema').emails;

  if (!validateEmail(email)) {
    debug('Rejected email address %s as invalid', email);
    return { status: 403 };
  }

  const mongoc = await mongo3.clientConnect({ concurrency: 1 });
  const emailAlreadyExists = await mongo3.count(mongoc, collection, { email });

  if (emailAlreadyExists === 1) {
    debug('Address %s already present', email);
    await mongoc.close();
    return { status: 201 };
  }

  await mongo3.writeOne(mongoc, collection, {
    email,
    registeredAt: new Date(),
    reason,
  });
  debug('Registed a new subscriber %s', email);
  await mongoc.close();
  return { status: 200 };
}

module.exports = {
  registerEmail,
};
