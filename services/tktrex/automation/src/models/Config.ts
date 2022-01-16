import * as t from 'io-ts';

export const Config = t.strict({
  DEBUG: t.string,
  API_BASE_URL: t.string,
}, 'Config');

export type Config = t.TypeOf<typeof Config>;

export default Config;
