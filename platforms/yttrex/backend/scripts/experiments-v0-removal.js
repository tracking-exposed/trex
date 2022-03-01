#!/usr/bin/env node
const _ = require('lodash');
const debug = require('debug')('');
const nconf = require('nconf');

const mongo = require('../lib/mongo3');

nconf.argv().env().file({ file: "config/settings.json" });

async function main() {
    const mongoc = await mongo.clientConnect();
    const collections = [ nconf.get('schema').htmls,
                          nconf.get('schema').metadata ];
    for (const collection of collections) {
        await countAndDeleteByCollection(mongoc, collection);
    }
    await mongoc.close();
}

async function countAndDeleteByCollection(mongoc, collection) {
    let remove = false;
    const filter = {experiment: { "$type": "string" }};
    if(!!nconf.get('delete'))
        remove = true;
    const ch = await mongo.count(mongoc, collection, filter);
    debug("matching collection %s = %d", collection, ch);
    if(ch && remove) {
        await mongo.deleteMany(mongoc, collection, filter);
        debug("Executed removal!")
    } else
        debug("Not executed any removal");
}

try {
    main();
} catch(error) {
    console.log(error);
}