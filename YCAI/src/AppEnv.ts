import * as t from 'io-ts';

const AppEnv = t.strict(
  {
    NODE_ENV: t.union([
      t.literal('development'),
      t.literal('test'),
      t.literal('production'),
    ]),
    PUBLIC_URL: t.string,
    API_URL: t.string,
    WEB_URL: t.string,
    DATA_DONATION_FLUSH_INTERVAL: t.string,
    VERSION: t.string,
    BUILD_DATE: t.string,
    YCAI_DEBUG: t.string,
  },
  'AppEnv'
);

type AppEnv = t.TypeOf<typeof AppEnv>;

export { AppEnv };

export {};
