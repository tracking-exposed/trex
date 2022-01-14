/* eslint-disable */

import _ from 'lodash';
import { MongoClient } from 'mongodb';
import D from 'debug';
import nconf from 'nconf';

const debug = D('lib:mongo');

let savedMongoUri: string | null = null;
function mongoUri(forced?: { uri: string }): string {
  // by passing 'null' you'll reset mongoUri
  if (_.isNull(forced)) savedMongoUri = null;

  if (forced?.uri) savedMongoUri = forced.uri;

  if (savedMongoUri) return savedMongoUri;

  /* if is not yet set, reset using the config */
  const mongoHost = nconf.get('mongoHost');
  const mongoPort = nconf.get('mongoPort');
  const mongoDb = nconf.get('mongoDb');

  if (!mongoHost || !mongoPort || !mongoDb) {
    debug('Configuration missing %o', { mongoHost, mongoPort, mongoDb });
    throw new Error('configuration missing');
  }

  savedMongoUri = `mongodb://${mongoHost}:${mongoPort}/${mongoDb}`;
  debug('Initializing mongoUri with %s', savedMongoUri);
  return savedMongoUri;
}

async function clientConnect(config: {}): Promise<MongoClient | undefined> {
  if (!config) config = {};

  try {
    const client = new MongoClient(mongoUri());
    return await client.connect();
  } catch (error) {
    debug(
      'mongo.clientConnect error in connecting at %s: %s',
      mongoUri(),
      (error as any).message
    );
  }
}

async function listCollections(mongoc: MongoClient) {
  return mongoc.db().listCollections().toArray();
}

async function writeOne(mongoc: MongoClient, cName: string, doc: any) {
  return mongoc.db().collection(cName).insertOne(doc);
}

async function insertMany(mongoc: any, cName: string, docs: any, options: any) {
  if (!options) options = {};
  return mongoc.db().collection(cName).insertMany(docs, options);
}

async function updateOne(mongoc: any, cName: any, selector: any, updated: any) {
  return mongoc.db().collection(cName).updateOne(selector, { $set: updated });
}

async function updateMany(mongoc: any, cName: string, selector: any, updated: any) {
  return mongoc.db().collection(cName).updateMany(selector, { $set: updated });
}

async function upsertOne(mongoc: any, cName: string, selector: any, updated: any) {
  return mongoc
    .db()
    .collection(cName)
    .updateOne(selector, { $set: updated }, { upsert: true });
}

async function read(mongoc: any, cName: any, selector: any, sorter: any) {
  return mongoc
    .db()
    .collection(cName)
    .find(selector)
    .sort(sorter || {})
    .toArray();
}

async function readOne(mongoc: any, cName: any, selector: any, sorter: any) {
  const l = await read(mongoc, cName, selector, sorter);
  if (_.size(l) > 1)
    debug('Warning, readOne %j returned %d docs', selector, _.size(l));
  return _.first(l);
}

async function deleteMany(mongoc: any, cName: any, selector: any) {
  if (_.size(_.keys(selector)) === 0)
    throw new Error(
      "Not in my watch: you can't delete everything with this library"
    );
  return mongoc.db().collection(cName).deleteMany(selector);
}

async function readLimit(mongoc: any, cName: any, selector: any, sorter: any, limitN: any, past: any) {
  if (!limitN)
    throw new Error('Not specified the amount of documents expected');
  return mongoc
    .db()
    .collection(cName)
    .find(selector)
    .sort(sorter)
    .skip(past || 0)
    .limit(limitN)
    .toArray();
}

async function count(mongoc: any, cName: any, selector: any) {
  return mongoc.db().collection(cName).countDocuments(selector);
}

async function createIndex(mongoc: any, cName: any, index: any, opt: any) {
  return mongoc.db().createIndex(cName, index, opt);
}

async function distinct(mongoc: any, cName: any, field: any, query: any) {
  return mongoc.db().collection(cName).distinct(field, query);
}

async function aggregate(mongoc: any, cName: any, pipeline: any) {
  return mongoc.db().collection(cName).aggregate(pipeline).toArray();
}

const DBClient = {
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

type DBClient = typeof DBClient & {
  client: MongoClient;
};
export default DBClient;
