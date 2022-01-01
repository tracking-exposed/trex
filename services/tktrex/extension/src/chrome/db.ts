import * as t from 'io-ts';
import { PathReporter } from 'io-ts/lib/PathReporter';
import { isLeft } from 'fp-ts/lib/Either';

import $ from 'jquery';

import { isEmpty, isFunction } from '../utils';
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

const setP = (key: string, value: unknown): Promise<unknown> =>
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

const init = (key: string, initializer: unknown): unknown => {
  if (isFunction(initializer)) {
    return initializer(key);
  }
  return initializer;
};

export const get = async (key: string, initializer?: unknown): Promise<unknown> => {
  const value = await getP(key);
  if (isEmpty(value) && !isEmpty(initializer)) {
    const newValue = init(key, initializer);
    await setP(key, newValue);
    log.info(`"${key}" was empty, initializing with ${newValue}`);
    return newValue;
  }
  log.info(`returning "${key}" from storage`, value);
  return value;
};

export const getValid = <C extends t.Any>(codec: C) =>
  async (key: string, initializer?: unknown): Promise<t.TypeOf<C>> => {
    const validation = codec.decode(await get(key, initializer));

    if (isLeft(validation)) {
      const details = PathReporter.report(validation).join('\n');
      const msg = `Error decoding "${key}" from storage:\n${details}`;
      log.error(msg);
      throw new Error(msg);
    }

    return validation.right;
  };

export const set = (key: string, value: unknown): Promise<unknown> => {
  const newValue = init(key, value);
  log.info(`setting "${key}" = ${newValue} in storage`);
  return setP(key, newValue);
};

export const update = async (key: string, updater: unknown): Promise<unknown> => {
  log.info(`updating "${key}" in storage`);
  const oldValue = await getP(key);

  if (isFunction(updater)) {
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
