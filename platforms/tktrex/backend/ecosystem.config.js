const tk = {
  backend: {
    name: 'server',
    namespace: 'tk:backend',
    cwd: __dirname,
    script: 'yarn start',
    watch: true,
    env: {
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
