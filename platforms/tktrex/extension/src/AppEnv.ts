import * as t from 'io-ts';

export const AppEnv = t.strict({
  NODE_ENV: t.union([
    t.literal('production'),
    t.literal('development'),
  ]),
  API_ROOT: t.string,
  WEB_ROOT: t.string,
  VERSION: t.string,
  BUILD: t.string,
  BUILDISODATE: t.string,
  FLUSH_INTERVAL: t.string,
  DEBUG: t.string,
}, 'TkTrexAppEnv');

export type AppEnv = t.TypeOf<typeof AppEnv>
