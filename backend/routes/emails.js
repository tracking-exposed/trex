const _ = require('lodash');
const nconf = require('nconf');
const debug = require('debug')('routes:answers');
const mongo3 = require('../lib/mongo3');



async function registerEmail(req) {
  const schema = nconf.get('schema').emails;
  const email = req.body.email;

  const mongoc = await mongo3.clientConnect({ concurrency: 1 });
  const emailAlreadyExists = await mongo3.count(mongoc, schema, { email });

  if (emailAlreadyExists === 1)  {
    return { json: { email } };
  }
  await mongo3.writeOne(mongoc, schema, { email, registeredAt: new Date() });
  return {
    json: {
      email,
    },
  };
}

module.exports = { registerEmail };
