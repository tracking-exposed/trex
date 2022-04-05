import crypto from 'crypto';
import os from 'os';
import PouchDB from 'pouchdb-node';
import pouchFind from 'pouchdb-find';

import createLogger from '@util/logger';
import { generateDirectoryStructure } from '@project/init';

PouchDB.plugin(pouchFind);

type JSONValue = string | number | boolean | null | JSONObject | JSONArray;
interface JSONObject {
  [key: string]: JSONValue;
}
type JSONArray = JSONValue[];

export type StorableValue = JSONValue | Date | StorableArray | StorableObject;
export interface StorableObject {
  [key: string]: StorableValue;
}
export type StorableArray = StorableValue[];

export function encode(val: string): string;
export function encode(val: number): number;
export function encode(val: boolean): boolean;
export function encode(val: null): null;
export function encode(val: Date): string;
export function encode(val: StorableArray): JSONArray;
export function encode(val: StorableObject): JSONObject;
export function encode(val: any): any {
  if (typeof val === 'string') {
    return val;
  } else if (typeof val === 'number') {
    return val;
  } else if (typeof val === 'boolean') {
    return val;
  } else if (val === null) {
    return null;
  } else if (val instanceof Date) {
    return val.toISOString();
  } else if (typeof val === 'object') {
    if (Array.isArray(val)) {
      return val.map(encode);
    } else {
      const acc: StorableObject = {};
      return Object.keys(val).reduce((acc, key) => {
        acc[key] = encode(val[key]);
        return acc;
      }, acc);
    }
  } else {
    throw new Error(`Unable to encode ${val}`);
  }
}

export function decode(val: string): string;
export function decode(val: number): number;
export function decode(val: boolean): boolean;
export function decode(val: null): null;
export function decode(val: string): Date;
export function decode(val: JSONObject): StorableObject;
export function decode(val: JSONArray): StorableArray;
export function decode(val: any): any {
  if (typeof val === 'string') {
    const maybeDate = new Date(val);
    try {
      if (maybeDate.toISOString() === val) {
        return maybeDate;
      } else {
        return val;
      }
    } catch (e) {
      return val;
    }
  } else if (typeof val === 'number') {
    return val;
  } else if (typeof val === 'boolean') {
    return val;
  } else if (val === null) {
    return null;
  } else if (typeof val === 'object') {
    if (Array.isArray(val)) {
      return val.map(decode);
    } else {
      const acc: JSONObject = {};
      return Object.keys(val).reduce((acc, key) => {
        acc[key] = decode(val[key]);
        return acc;
      }, acc);
    }
  } else {
    throw new Error(`Unable to decode ${val}`);
  }
}

export interface BaseModel extends StorableObject {
  type: string;
}

export const isSavedModelWithType =
  (type: string) =>
  (
    model: unknown
  ): model is BaseModel & Record<'type', typeof type> & Record<'_id', string> =>
    model !== null &&
    typeof model === 'object' &&
    (model as any).type === type &&
    typeof (model as any)._id === 'string';

export interface SavedModel extends BaseModel {
  _id: string;
}

export const flatSortObjects = (v: JSONValue): JSONValue => {
  if (Array.isArray(v)) {
    return v.map(flatSortObjects);
  } else if (v && typeof v === 'object') {
    return Object.entries(v)
      .sort(([k1], [k2]) => k1.localeCompare(k2))
      .map(([k, v]) => [k, flatSortObjects(v)]);
  } else {
    return v;
  }
};

export const preHash = (model: JSONObject): JSONArray => [
  Date.now(),
  flatSortObjects(model),
];

export const hash = (data: JSONValue, length?: number): string => {
  const hash = crypto.createHash('sha256');
  hash.update(JSON.stringify(data));
  const hex = hash.digest('hex');

  if (length) {
    return hex.substring(0, length);
  }

  return hex;
};

export const getRandomString = (length = 32): string =>
  hash(
    `${os.platform()}${os.arch()}${os.uptime()}${Date.now()}${Math.random()}`,
    length
  );

export const uuid = <M extends BaseModel>(model: M): string =>
  hash(preHash(encode(model)));

interface Db {
  save: <M extends BaseModel>(model: M) => Promise<M & SavedModel>;
  saveMany: <M extends BaseModel>(models: M[]) => Promise<M[] & SavedModel[]>;
  findMany: (type: string) => Promise<BaseModel[] & SavedModel[]>;
}

export const createDb = async (projectDirectory: string): Promise<Db> => {
  const { log } = createLogger();
  const { databaseDirectory } = generateDirectoryStructure(projectDirectory);

  const pouch = new PouchDB(databaseDirectory);
  await pouch.createIndex({
    index: {
      fields: ['type'],
    },
  });

  log('Created database at:', databaseDirectory);

  const save = async <M extends BaseModel>(
    model: M
  ): Promise<M & SavedModel> => {
    const now = Date.now();

    const withId: M & SavedModel = {
      ...model,
      createdAt: now,
      updatedAt: now,
      _id: uuid(model),
      salt: getRandomString(),
    };

    const encoded = encode(withId);
    await pouch.put(encoded);
    log('Saved model:', withId);

    return withId;
  };

  const saveMany = async <M extends BaseModel>(
    models: M[]
  ): Promise<M[] & SavedModel[]> => Promise.all(models.map(save));

  type FindResults = Array<BaseModel & SavedModel>;
  const findMany = async (type: string): Promise<FindResults> => {
    const response = await pouch.find({
      selector: {
        type,
      },
    });

    const validDocs: FindResults = [];

    for (const doc of response.docs) {
      const decoded = decode(doc as unknown as JSONObject);

      // TODO: Perform some validation here,
      // e.g. check that the type matches the expected type
      // maybe run migrations if needed

      if (!isSavedModelWithType(type)(decoded)) {
        // if PouchDB does its job well and the database is not corrupted,
        // this should never happen
        throw new Error(`document ${doc._id} does not match type ${type}`);
      } else {
        validDocs.push(decoded);
      }
    }

    return validDocs;
  };

  return {
    save,
    saveMany,
    findMany,
  };
};

export default createDb;
