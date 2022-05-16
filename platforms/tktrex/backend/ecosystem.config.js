const testEnv = {
  mongoDb: 'tktrex',
};

const tk = {
  backend: {
    name: 'tk-backend',
    namespace: 'tk-trex',
    cwd: __dirname,
    script: 'yarn watch',
    watch: false,
    env_test: testEnv,
  },
  parser: {
    name: 'tk-parser',
    namespace: 'tk-trex',
    cwd: __dirname,
    script: 'yarn parserv:watch',
    watch: false,
    env_test: {
      ...testEnv,
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
