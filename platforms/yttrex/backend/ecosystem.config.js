const commonENV = {
  DEBUG_COLORS: true,
};

const yt = {
  backend: {
    name: 'yt:server',
    namespace: 'yt:backend',
    cwd: __dirname,
    script: 'yarn start',
    watch: true,
    env: {
      ...commonENV,
      ...process.env,
      key: process.env.KEY,
    },
  },
  leavesParser: {
    name: 'yt:leaveserv',
    namespace: 'yt:backend',
    cwd: __dirname,
    script: 'yarn leaveserv',
    watch: true,
    env: {
      ...commonENV,
    },
  },
  parser: {
    name: 'yt:parserv',
    namespace: 'yt:backend',
    cwd: __dirname,
    script: 'yarn parserv',
    watch: true,
    env: {
      ...commonENV,
    },
  },
};

module.exports = {
  commonENV,
  yt,
  apps: [
    // yt ecosystem
    yt.backend,
    yt.leavesParser,
    yt.parser,
  ],
};
