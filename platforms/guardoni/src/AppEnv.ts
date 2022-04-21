import * as t from 'io-ts';

const AppEnv = t.strict(
  {
    NODE_ENV: t.union([t.literal('development'), t.literal('production')]),
    VERSION: t.string,
    YT_BACKEND: t.string,
    TK_BACKEND: t.string,
    DEBUG: t.string,
  },
  'AppEnv'
);

type AppEnv = t.TypeOf<typeof AppEnv>;

export { AppEnv };
