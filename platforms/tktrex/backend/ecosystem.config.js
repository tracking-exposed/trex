
const testEnv = {
  mongoDb: 'tktrex-test',
  mongoPort: 27019,
};

const tk = {
  backend: {
    name: 'tk-backend',
    namespace: 'tk-trex',
    cwd: __dirname,
    script: 'yarn watch',
    watch: false,
    env_test: {
      ...testEnv.tk,
      port: 14001,
    },
  },
  parser: {
    name: 'tk-parser',
    namespace: 'tk-trex',
    cwd: __dirname,
    script: 'yarn parserv:watch',
    watch: false,
    env_test: {
      ...testEnv.tk,
    },
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
