const { AppEnv } = require('./src/AppEnv');
const path = require('path');
const { getConfig } = require('../shared/build/webpack/config');

module.exports = {
  ...getConfig({
    cwd: __dirname,
    outputDir: path.resolve(__dirname, 'build/dashboard'),
    env: AppEnv,
    entry: {
      dashboard: path.resolve(__dirname, 'src/dashboard.tsx'),
    },
  }),
  devServer: {
    host: '0.0.0.0',
  },
};
