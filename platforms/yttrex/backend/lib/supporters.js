/* supporter library contains DB ops related to the supporter */
const nconf = require('nconf');
const debug = require('debug')('lib:supporters');

const mongo3 = require('./mongo3');

async function update(publicKey, updated) {
  // this function is used by routes/tags.js and might be 
  // used every time we should update the supporter profile
    const mongoc = await mongo3.clientConnect({concurrency: 1});

    const exists = await mongo3.readOne(mongoc, nconf.get('schema').supporters, { publicKey });
    if(!exists)
        throw new Error("publicKey do not match any user - this function is only meant to update existing profiles");

    if(updated.publicKey !== publicKey)
        throw new Error("publicKey can't be updated");

    updated.lastActivity = new Date();
    const d = await mongo3.deleteMany(mongoc, nconf.get('schema').supporters, { publicKey });
    const r = await mongo3.writeOne(mongoc, nconf.get('schema').supporters, updated);

    if(!(r.result && r.result.ok) || !(d.result && r.result.ok)) {
        debug("Bad mongodb error in delete+write as update: %j %j %j", d, r, updated);
        throw new Error("Failure in supporter update", JSON.stringify(updated));
    }

    const retval = await mongo3.readOne(mongoc, nconf.get('schema').supporters, { publicKey });
    await mongoc.close();
    return retval;
};

async function get(publicKey) {
    const mongoc = await mongo3.clientConnect({concurrency: 1});
    const supporter = await mongo3.readOne(mongoc, nconf.get('schema').supporters, { publicKey });
    if(!supporter)
        throw new Error("publicKey do not match any user");

    await mongoc.close();
    return supporter;
}

async function remove(publicKey) {
    const mongoc = await mongo3.clientConnect({concurrency: 1});
    const dunno = await mongo3.deleteMany(mongoc, nconf.get('schema').supporters, { publicKey });
    await mongoc.close();
    return dunno;
}

module.exports = {
    get,
    remove,
    update
};
