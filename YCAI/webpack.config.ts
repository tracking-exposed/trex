import { AppEnv } from './src/AppEnv';
import path from 'path';
import { getConfig } from '../shared/build/webpack/config';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import packageJson from './package.json';

process.env.VERSION = packageJson.version;

const { buildENV, ...config } = getConfig({
  cwd: __dirname,
  outputDir: path.resolve(__dirname, 'build/dashboard'),
  env: AppEnv,
  entry: {
    dashboard: path.resolve(__dirname, 'src/dashboard.tsx'),
  },
});

config.plugins.push(
  new CopyWebpackPlugin({
    patterns: [
      {
        from: 'public',
        filter: (file: string) => {
          const { base } = path.parse(file);
          return !['manifest.json', 'popup.html'].includes(base);
        },
      },
    ],
  })
);

export default {
  ...config,
  devtool: 'source-map',
  devServer: {
    host: '0.0.0.0',
    port: 3000,
    hot: true,
  },
};
