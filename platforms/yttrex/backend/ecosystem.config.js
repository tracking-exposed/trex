const testEnv = {
  mongoDb: 'yttrex-test',
};

const yt = {
  backend: {
    name: 'server:watch',
    namespace: 'yt:backend',
    cwd: __dirname,
    script: 'yarn watch',
    watch: false,
    env_test: testEnv,
  },

  leavesParser: {
    name: 'leaveserv:watch',
    namespace: 'yt:backend',
    cwd: __dirname,
    script: 'yarn leaveserv:watch',
    watch: false,
    env_test: testEnv,
  },
  parser: {
    name: 'parserv:watch',
    namespace: 'yt:backend',
    cwd: __dirname,
    script: 'yarn parserv:watch',
    watch: false,
    env_test: testEnv,
  },
};

module.exports = {
  yt,
  apps: [
    // yt ecosystem
    yt.backend,
    yt.leavesParser,
    yt.parser,
  ],
};
