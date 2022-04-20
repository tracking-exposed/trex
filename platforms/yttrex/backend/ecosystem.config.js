const testEnv = {
  mongoDb: 'yttrex-test',
  mongoPort: 27019,
};

const yt = {
  backend: {
    name: 'yt-backend',
    namespace: 'yt-trex',
    cwd: __dirname,
    script: 'yarn watch',
    watch: false,
    env_test: testEnv,
  },

  leavesParser: {
    name: 'yt-leaves-parser',
    namespace: 'yt-trex',
    cwd: __dirname,
    script: 'yarn leaveserv:watch',
    watch: false,
    env_test: {
      ...testEnv,
    },
  },
  parser: {
    name: 'yt-parser',
    namespace: 'yt-trex',
    cwd: __dirname,
    script: 'yarn parserv:watch',
    watch: false,
    env_test: {
      ...testEnv,
    },
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
