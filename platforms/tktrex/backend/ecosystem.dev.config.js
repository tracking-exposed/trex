const { commonENV } = require('./ecosystem.config');
const path = require('path');

require('dotenv').config({
  path: path.resolve(__dirname, '.env.development'),
  override: true,
});

const env = {
  ...commonENV,
  ...process.env,
  key: 'fuffa',
};

const testEnv = {
  ...env,
  mongoDb: 'tktrex-test',
};

const tk = {
  backend: {
    name: 'tk:backend:watch',
    namespace: 'tk:backend',
    cwd: __dirname,
    script: 'yarn watch',
    watch: false,
    env,
    env_test: testEnv,
  },
  parser: {
    name: 'tk:parserv:watch',
    namespace: 'tk:backend',
    cwd: __dirname,
    script: 'yarn parserv:watch --minutesago 60',
    watch: false,
    env,
    env_test: testEnv,
  },
};

module.exports = {
  tk,
  apps: [
    // tk ecosystem
    tk.backend,
    tk.parser,
  ],
};
