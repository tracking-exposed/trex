import * as t from 'io-ts';
import { PathReporter } from 'io-ts/lib/PathReporter';
import { isLeft } from 'fp-ts/lib/Either';

import $ from 'jquery';

import { isEmpty } from '../utils';
import log from '../logger';

const bo = chrome;
const storage = bo.storage.local;

const getP = (key: string): Promise<unknown> =>
  new Promise((resolve, reject) => {
    storage.get(key, (val) => {
      if (bo.runtime.lastError) {
        return reject(bo.runtime.lastError);
      }
      resolve(val[key]);
    });
  });

const setP = <T>(key: string, value: T): Promise<T> =>
  new Promise((resolve, reject) => {
    storage.set({
      [key]: value,
    }, () => {
      if (bo.runtime.lastError) {
        return reject(bo.runtime.lastError);
      }
      resolve(value);
    });
  });

const init = <T>(key: string, initializer: T | ((str: string) => T)): T => {
  if (initializer instanceof Function) {
    return initializer(key);
  }
  return initializer;
};

export const get = async(key: string, initializer?: unknown): Promise<unknown> => {
  const value = await getP(key);
  if (isEmpty(value) && !isEmpty(initializer)) {
    const newValue = init(key, initializer);
    await setP(key, newValue);
    log.info(`"${key}" was empty, initializing with`, newValue);
    return newValue;
  }
  log.info(`returning "${key}" from storage`, value);
  return value;
};

export const getValid = <C extends t.Any>(codec: C) =>
  async(key: string, initializer?: unknown): Promise<t.TypeOf<C>> => {
    const validation = codec.decode(await get(key, initializer));

    if (isLeft(validation)) {
      const details = PathReporter.report(validation).join('\n');
      const msg = `error decoding "${key}" from storage:\n${details}`;
      log.error(msg);
      throw new Error(msg);
    }

    return validation.right;
  };

export const set = <T>(key: string, value: T): Promise<T> => {
  const newValue = init(key, value);
  log.info(`setting "${key}" in storage to`, newValue);
  return setP(key, newValue);
};

export const update = async <T>(key: string, updater: (T | ((x: unknown) => T))): Promise<T> => {
  log.info(`updating "${key}" in storage`);
  const oldValue = await getP(key);

  if (updater instanceof Function) {
    const newValue = updater(oldValue);
    return setP(key, newValue);
  }

  return setP(key, $.extend(true, oldValue, updater));
};

export const remove = (key: string): Promise<unknown> => {
  log.info(`removing "${key}" from storage`);
  return storage.remove(key);
};

export default {
  get, getValid, set,
  update, remove,
};
