const { AppEnv } = require('./src/AppEnv');
const path = require('path');
const { getConfig } = require('../shared/build/webpack/config');

process.env.VERSION = require('./package.json').version;

const { buildENV, ...config } = getConfig({
  cwd: __dirname,
  outputDir: path.resolve(__dirname, 'build/dashboard'),
  env: AppEnv,
  entry: {
    dashboard: path.resolve(__dirname, 'src/dashboard.tsx'),
  },
});

module.exports = {
  ...config,
  devtool: 'source-map',
  devServer: {
    host: '0.0.0.0',
  },
};
