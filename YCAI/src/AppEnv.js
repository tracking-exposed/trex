const t = require('io-ts');

const AppEnv = t.strict(
  {
    PUBLIC_URL: t.string,
    API_URL: t.string,
    WEB_URL: t.string,
    DEBUG: t.string,
  },
  'AppEnv'
);

module.exports = { AppEnv };
