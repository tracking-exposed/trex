import _ from 'lodash';
import crypto from 'crypto';
import { trexLogger } from '../logger';

const hashdebug = trexLogger.extend('encode-utils');

export function hash(obj: any, fields?: string[]): string {
  if (_.isUndefined(fields)) fields = _.keys(obj);
  const plaincnt = fields.reduce(function (memo, fname) {
    memo += fname + '∴' + JSON.stringify(_.get(obj, fname, '…miss!')) + ',';
    return memo;
  }, '');
  const sha1sum = crypto.createHash('sha1');
  sha1sum.update(plaincnt);
  const retval = sha1sum.digest('hex');
  hashdebug.info('%s produced by hashing %s', retval, plaincnt);
  return retval;
}

export interface EncodeUtils<T> {
  hash: (m: T) => string;
}

export type GetEncodeUtils = <T, S>(f: (m: T) => S) => EncodeUtils<T>;

export const GetEncodeUtils: GetEncodeUtils = <T, S>(f: (m: T) => S) => {
  return {
    hash: (o: T): string => {
      return hash(f(o));
    },
  };
};
