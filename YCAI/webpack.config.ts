const { AppEnv } = require('./src/AppEnv');
const path = require('path');
const { getConfig } = require('../shared/build/webpack/config');
const packageJson = require('./package.json');

process.env.VERSION = packageJson.version;

const { buildENV, ...config } = getConfig({
  cwd: __dirname,
  outputDir: path.resolve(__dirname, 'build/dashboard'),
  env: AppEnv,
  entry: {
    dashboard: path.resolve(__dirname, 'src/dashboard.tsx'),
  },
});

export default {
  ...config,
  devtool: 'source-map',
  devServer: {
    host: '0.0.0.0',
    port: 3000,
  },
};
