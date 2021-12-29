import $ from 'jquery';

import { isEmpty, isFunction } from '../utils';
import log from '../logger';

const bo = chrome;
const backend = bo.storage.local;

export function get(
  key: string,
  setIfMissing: unknown = undefined,
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    backend.get(key, val => {
      if (bo.runtime.lastError) {
        reject(bo.runtime.lastError);
      } else if (isEmpty(val) && !isEmpty(setIfMissing)) {
        const newVal = isFunction(setIfMissing)
          ? setIfMissing(key) : setIfMissing;
        log.debug('get is empty ', newVal);
        backend.set(newVal, () => resolve(newVal));
      } else {
        log.debug('get returns', val, key, val[key]);
        resolve(isEmpty(val[key]) ? null : val[key]);
      }
    });
  });
}

export function set(key: string, value: unknown): Promise<unknown> {
  log.debug('db.set', key, value);

  return new Promise((resolve, reject) => {
    const newVal = {
      [key]: isFunction(value) ? value(key) : value,
    };
    backend.set(newVal, () => {
      if (bo.runtime.lastError) {
        reject(bo.runtime.lastError);
      } else {
        resolve(newVal[key]);
      }
    });
  });
}

export function update(key: string, value: unknown): Promise<unknown> {
  return new Promise((resolve, reject) => {
    get(key)
      .then(oldVal => {
        let newVal;
        if (isFunction(value)) {
          newVal = value(oldVal);
        } else {
          newVal = $.extend(true, oldVal, value);
        }
        set(key, newVal)
          .then(val => resolve(val))
          .catch(error => reject(error));
      })
      .catch(error => reject(error));
  });
};

export function remove(key: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    backend.remove(key)
      .then(val => resolve(val))
      .catch(error => reject(error));
  });
};

export default {
  get, set,
  update, remove,
};
