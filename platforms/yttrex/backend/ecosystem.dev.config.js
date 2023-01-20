const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const { commonENV } = require('./ecosystem.config');

const envDot = dotenv.parse(
  fs.readFileSync(path.resolve(__dirname, '.env'), 'utf-8')
);

const env = {
  ...envDot,
  ...commonENV,
};

const testEnv = {
  ...commonENV,
  mongoDb: 'yttrex-test',
};

const yt = {
  backendWatch: {
    name: 'yt:server:watch',
    namespace: 'yt:backend',
    cwd: __dirname,
    script: 'yarn watch',
    watch: false,
    env,
    env_test: testEnv,
  },
  leavesParserWatch: {
    name: 'yt:leaveserv:watch',
    namespace: 'yt:backend',
    cwd: __dirname,
    script: 'yarn leaveserv:watch',
    watch: false,
    env,
    env_test: testEnv,
  },
  parserWatch: {
    name: 'yt:parserv:watch',
    namespace: 'yt:backend',
    cwd: __dirname,
    script:
      'NODE_OPTIONS=--max-old-space-size=2048 yarn parserv:watch --minutesago 60',
    watch: false,
    env,
    env_test: testEnv,
  },
};

module.exports = {
  yt,
  apps: [
    // yt ecosystem
    yt.backendWatch,
    yt.leavesParserWatch,
    yt.parserWatch,
  ],
};
