const testEnv = {
  mongoDb: 'tktrex-test',
};

const tk = {
  backend: {
    name: 'tk:backend:watch',
    namespace: 'tk:backend',
    cwd: __dirname,
    script: 'yarn watch',
    watch: false,
    env_test: testEnv,
  },
  parser: {
    name: 'tk:parserv:watch',
    namespace: 'tk:backend',
    cwd: __dirname,
    script: 'yarn parserv:watch --minutesago 10',
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
