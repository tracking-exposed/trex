/* automo.js means "automongo". 
 * This library should be included most of the time, because implement high level functions about mongodb access.
 * all the functions implemented in routes, libraries, and whatsoever, should be implemented here.
 *
 * The module mongo3.js MUST be used only in special cases where concurrency wants to be controlled 
 */
const _ = require('lodash');
const nconf = require('nconf');
const debug = require('debug')('lib:automo');

const mongo3 = require('./mongo3');
const params = require('./params');

async function getMetadataByPublicKey(publicKey, options) {
    const mongoc = await mongo3.clientConnect({concurrency: 1});
    const supporter = await mongo3.readOne(mongoc, nconf.get('schema').supporters, { publicKey });

    if(!supporter)
        throw new Error("publicKey do not match any user");

    const metadata = mongo3.readLimit(mongoc,
        nconf.get('schema').metadata, { watcher: supporter.p }, { savingTime: -1 },
        options.amount, options.skip);

    await mongoc.close();
    return { supporter, metadata };
};

/*
async function get(options) {
    const mongoc = await mongo3.clientConnect({concurrency: 1});
    await mongoc.close();
};
*/

async function getMetadataByFilter(filter, options) {
    const mongoc = await mongo3.clientConnect({concurrency: 1});
    const metadata = mongo3.readLimit(mongoc,
        nconf.get('schema').metadata, filter, { savingTime: -1 },
        options.amount, options.skip);

    await mongoc.close();
    return metadata;
};

async function getRelatedByWatcher(watcher) {
    const mongoc = await mongo3.clientConnect({concurrency: 1});
    const related = await mongo3
        .aggregate(mongoc, nconf.get('schema').metadata, [
            { $match: { 'watcher': supporter.p }},
            { $lookup: { from: 'videos', localField: 'id', foreignField: 'id', as: 'videos' }},
            { $unwind: '$related' }
        ]);
    await mongoc.close();
    return related;
}

async function getFirstVideos(when, options) {
    // expected when to be a moment(), TODO assert when.isValid()
    const mongoc = await mongo3.clientConnect({concurrency: 1});
    const selected = await mongo3
        .readLimit(mongoc,
            nconf.get('schema').videos,
            { savingTime: { $gte: new Date(when.toISOString()) }}, { savingTime: 1 },
            options.amount, options.skip);
    await mongoc.close();
    return selected;
};


module.exports = {
   
    /* used by routes/personal */
    getMetadataByPublicKey,
    getRelatedByWatcher,

    /* used by routes/public */
    getMetadataByFilter,

    /* used by routes/rsync */
    getFirstVideos,
};
