const yt = {
  backend: {
    name: 'yt:server',
    namespace: 'yt:backend',
    cwd: __dirname,
    script: 'yarn start',
    watch: true,
    env: {
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
  },
  parser: {
    name: 'yt:parserv',
    namespace: 'yt:backend',
    cwd: __dirname,
    script: 'yarn parserv',
    watch: true,
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
