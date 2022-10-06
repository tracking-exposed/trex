const commonENV = {
  DEBUG_COLORS: true,
};

const tk = {
  backend: {
    name: 'server',
    namespace: 'tk:backend',
    cwd: __dirname,
    script: 'yarn start',
    watch: true,
    env: {
      ...commonENV,
      ...process.env,
      key: process.env.KEY,
    },
  },
  parser: {
    name: 'tk:parserv',
    namespace: 'tk:backend',
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
  tk,
  apps: [
    // tk ecosystem
    tk.backend,
    tk.parser,
  ],
};
