const { AppEnv } = require('./src/AppEnv');
const { getConfig } = require('../shared/build/webpack/config');
const path = require('path');
const FileManagerPlugin = require('filemanager-webpack-plugin');

const config = getConfig({
  cwd: __dirname,
  outputDir: path.resolve(__dirname, 'build/extension'),
  env: AppEnv,
  entry: {
    app: path.resolve(__dirname, 'src/app.tsx'),
    popup: path.resolve(__dirname, 'src/popup.tsx'),
    background: path.resolve(__dirname, 'src/background/index.ts'),
  },
});

if (config.mode === 'production') {
  config.plugins.push(
    new FileManagerPlugin({
      events: {
        onEnd: {
          archive: [
            {
              source: './build/extension',
              destination: './build/extension/extension.zip',
            },
          ],
        },
      },
    })
  );
}

module.exports = config;
