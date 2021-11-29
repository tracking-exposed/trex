const _ = require('lodash');
const MongoClient = require('mongodb').MongoClient;
const debug = require('debug')('lib:mongo');
const nconf = require('nconf');

let savedMongoUri = null;
function mongoUri(forced) {

    // by passing 'null' you'll reset mongoUri
    if(_.isNull(forced))
        savedMongoUri = null;

    if(forced && forced.uri)
        savedMongoUri = forced.uri;

    if(savedMongoUri)
        return savedMongoUri;

    /* if is not yet set, reset using the config */
    const mongoHost = nconf.get('mongoHost');
    const mongoPort = nconf.get('mongoPort');
    const mongoDb = nconf.get('mongoDb');

    if(!mongoHost || !mongoPort || !mongoDb) {
        debug('Configuration missing %o', { mongoHost, mongoPort, mongoDb})
        throw new Error("configuration missing");
    }

    savedMongoUri = `mongodb://${mongoHost}:${mongoPort}/${mongoDb}`;
    debug("Initializing mongoUri with %s", savedMongoUri);
    return savedMongoUri;
}

async function clientConnect(config) {
    if(!config) config = {};

    try {
        const client = new MongoClient(mongoUri());
        return await client.connect();
    } catch(error) {
        debug("mongo.clientConnect error in connecting at %s: %s",
            mongoUri(), error.message);
    }
};

async function listCollections(mongoc) {
    return mongoc
        .db()
        .listCollections()
        .toArray();
};

async function writeOne(mongoc, cName, doc) {
    return mongoc
        .db()
        .collection(cName)
        .insertOne(doc);
};

async function insertMany(mongoc, cName, docs, options) {
    if(!options) options = {};
    return mongoc
        .db()
        .collection(cName)
        .insertMany(docs, options);
};

async function updateOne(mongoc, cName, selector, updated) {
    return mongoc
        .db()
        .collection(cName)
        .updateOne(selector, { $set: updated });
};

async function updateMany(mongoc, cName, selector, updated) {
    return mongoc
        .db()
        .collection(cName)
        .updateMany(selector, { $set: updated });
}

async function upsertOne(mongoc, cName, selector, updated) {
    return mongoc
        .db()
        .collection(cName)
        .updateOne(selector, { $set: updated }, { upsert: true});
};

async function read(mongoc, cName, selector, sorter) {
    return mongoc
        .db()
        .collection(cName)
        .find(selector)
        .sort(sorter || {})
        .toArray();
};

async function readOne(mongoc, cName, selector, sorter) {
    const l = await read(mongoc, cName, selector, sorter);
    if(_.size(l) > 1)
        debug("Warning, readOne %j returned %d docs", selector, _.size(l));
    return _.first(l);
};

async function deleteMany(mongoc, cName, selector) {
    if(_.size(_.keys(selector)) === 0)
        throw new Error("Not in my watch: you can't delete everything with this library");
    return mongoc
        .db()
        .collection(cName)
        .deleteMany(selector);
};

async function readLimit(mongoc, cName, selector, sorter, limitN, past) {
    if(!limitN)
        throw new Error("Not specified the amount of documents expected");
    return mongoc
        .db()
        .collection(cName)
        .find(selector)
        .sort(sorter)
        .skip(past || 0)
        .limit(limitN)
        .toArray();
};

async function count(mongoc, cName, selector) {
    return mongoc
        .db()
        .collection(cName)
        .countDocuments(selector);
};


async function createIndex(mongoc, cName, index, opt) {
    return mongoc
        .db()
        .createIndex(cName, index, opt);
};

async function distinct(mongoc, cName, field, query) {
    return mongoc
        .db()
        .collection(cName)
        .distinct(field, query);
};

async function aggregate(mongoc, cName, pipeline) {
    return mongoc
        .db()
        .collection(cName)
        .aggregate(pipeline)
        .toArray();
};

module.exports = {
    clientConnect,
    mongoUri,

    listCollections,
    writeOne,
    insertMany,
    updateOne,
    updateMany,
    upsertOne,
    readOne,
    read,
    readLimit,
    deleteMany,
    count,
    createIndex,
    distinct,
    aggregate,
};
