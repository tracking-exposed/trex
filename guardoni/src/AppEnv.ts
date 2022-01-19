import * as t from 'io-ts';

const AppEnv = t.strict(
  {
    NODE_ENV: t.union([t.literal('development'), t.literal('production')]),
    VERSION: t.string,
    BACKEND: t.string,
  },
  'AppEnv'
);

type AppEnv = t.TypeOf<typeof AppEnv>;

export { AppEnv };
