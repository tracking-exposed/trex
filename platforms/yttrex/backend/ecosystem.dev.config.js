const testEnv = {
  mongoDb: 'yttrex-test',
};

const yt = {
  backendWatch: {
    name: 'yt:server:watch',
    namespace: 'yt:backend',
    cwd: __dirname,
    script: 'yarn watch',
    watch: false,
    env_test: testEnv,
  },
  leavesParserWatch: {
    name: 'yt:leaveserv:watch',
    namespace: 'yt:backend',
    cwd: __dirname,
    script: 'yarn leaveserv:watch',
    watch: false,
    env_test: testEnv,
  },
  parserWatch: {
    name: 'yt:parserv:watch',
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
    yt.backendWatch,
    yt.leavesParserWatch,
    yt.parserWatch,
  ],
};
