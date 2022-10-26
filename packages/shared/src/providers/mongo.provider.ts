import D from 'debug';
import _ from 'lodash';
import {
  Document,
  MongoClient,
  AggregateOptions,
  CollectionInfo,
  IndexSpecification,
  DeleteResult,
  MongoClientOptions,
  UpdateResult,
  Filter,
  WithId,
} from 'mongodb';
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

async function clientConnect(
  config?: MongoClientOptions
): Promise<MongoClient> {
  try {
    const client = new MongoClient(mongoUri(), config);
    return await client.connect();
  } catch (error: any) {
    debug(
      'mongo.clientConnect error in connecting at %s: %s',
      mongoUri(),
      error.message
    );
    throw error;
  }
}

async function listCollections(mongoc: MongoClient): Promise<CollectionInfo[]> {
  return mongoc.db().listCollections().toArray();
}

async function writeOne(
  mongoc: MongoClient,
  cName: string,
  doc: any
): Promise<any> {
  return mongoc.db().collection(cName).insertOne(doc);
}

async function insertMany(
  mongoc: MongoClient,
  cName: string,
  docs: any[],
  options?: any
): Promise<void> {
  if (!options) options = {};
  return mongoc.db().collection(cName).insertMany(docs, options);
}

async function updateOne(
  mongoc: MongoClient,
  cName: string,
  selector: any,
  updated: any
): Promise<any> {
  return mongoc.db().collection(cName).updateOne(selector, { $set: updated });
}

async function updateMany(
  mongoc: MongoClient,
  cName: string,
  selector: any,
  updated: any
): Promise<any> {
  return mongoc.db().collection(cName).updateMany(selector, { $set: updated });
}

async function upsertOne(
  mongoc: MongoClient,
  cName: string,
  selector: any,
  updated: any
): Promise<UpdateResult> {
  return mongoc
    .db()
    .collection(cName)
    .updateOne(selector, { $set: updated }, { upsert: true });
}

async function read(
  mongoc: MongoClient,
  cName: string,
  selector: any,
  sorter: any
): Promise<any[]> {
  return mongoc
    .db()
    .collection(cName)
    .find(selector)
    .sort(sorter || {})
    .toArray();
}

async function readOne(
  mongoc: MongoClient,
  cName: string,
  selector: any,
  sorter?: any
): Promise<any> {
  const l = await read(mongoc, cName, selector, sorter);
  if (_.size(l) > 1)
    debug('Warning, readOne %j returned %d docs', selector, _.size(l));
  return _.first(l);
}

async function deleteMany(
  mongoc: MongoClient,
  cName: string,
  selector: any
): Promise<DeleteResult> {
  if (_.size(_.keys(selector)) === 0)
    throw new Error(
      "Not in my watch: you can't delete everything with this library"
    );
  return mongoc.db().collection(cName).deleteMany(selector);
}

async function readLimit<T extends Document = any>(
  mongoc: MongoClient,
  cName: string,
  selector: Filter<T>,
  sorter: any,
  limitN: number,
  past: number
): Promise<Array<WithId<T>>> {
  if (!limitN)
    throw new Error('Not specified the amount of documents expected');
  return mongoc
    .db()
    .collection<T>(cName)
    .find(selector)
    .sort(sorter)
    .skip(past || 0)
    .limit(limitN)
    .toArray();
}

async function count<T = any>(
  mongoc: MongoClient,
  cName: string,
  selector: Filter<T>
): Promise<number> {
  const n = await mongoc.db().collection(cName).countDocuments(selector);
  return n;
}

async function createIndex(
  mongoc: MongoClient,
  cName: string,
  index: IndexSpecification,
  opt: any
): Promise<any> {
  return mongoc.db().createIndex(cName, index, opt);
}

async function distinct(
  mongoc: MongoClient,
  cName: string,
  field: any,
  query: any
): Promise<any> {
  return mongoc.db().collection(cName).distinct(field, query);
}

async function aggregate(
  mongoc: MongoClient,
  cName: string,
  pipeline: any,
  explain?: AggregateOptions
): Promise<any[]> {
  return mongoc.db().collection(cName).aggregate(pipeline, explain).toArray();
}

export {
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
