/* supporter library contains DB ops related to the supporter */
const _ = require('lodash');
const nconf = require('nconf');
const debug = require('debug')('lib:supporters');

const mongo3 = require('./mongo3');
const params = require('./params');

async function update(publicKey, updated) {
  // this function is used by routes/tags.js and might be 
  // used every time we should update the supporter profile
    const mongoc = await mongo3.clientConnect({concurrency: 1});

    const exists = await mongo3.readOne(mongoc, nconf.get('schema').supporters, { publicKey });
    if(!exists)
        throw new Error("publicKey do not match any user - this function is only meant to update existing profiles");

    if(updated.publicKey != publicKey)
        throw new Error("publicKey can't be updated");

    updated.lastActivity = new Date();
    const r = await mongo3.updateOne(mongoc, nconf.get('schema').supporters, { publicKey }, updated);

    if(!(r.result && r.result.ok)) {
        console.log(JSON.stringify(r, undefined, 1));
        throw new Error("Failure in supporter update");
    }

    const retval = await mongo3.readOne(mongoc, nconf.get('schema').supporters, { publicKey });
    await mongoc.close();
    return retval;
};

async function get(publicKey) {
    const mongoc = await mongo3.clientConnect({concurrency: 1});
    let supporter = await mongo3.readOne(mongoc, nconf.get('schema').supporters, { publicKey });
    if(!supporter)
        throw new Error("publicKey do not match any user");

    await mongoc.close();
    return supporter;
}

async function remove(publicKey) {
    const mongoc = await mongo3.clientConnect({concurrency: 1});
    let dunno = await mongo3.deleteMany(mongoc, nconf.get('schema').supporters, { publicKey });
    await mongoc.close();
    return dunno;
}

module.exports = {
    get,
    remove,
    update
};
