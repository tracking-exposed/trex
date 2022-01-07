import { AppEnv } from './src/AppEnv';
import path from 'path';
import { getConfig } from '../shared/src/webpack/config';
import { CopyWebpackPlugin } from '../shared/src/webpack/plugins';
import packageJson from './package.json';

process.env.VERSION = packageJson.version;

const { buildENV, ...config } = getConfig({
  cwd: __dirname,
  target: 'web',
  outputDir: path.resolve(__dirname, 'build/dashboard'),
  env: AppEnv,
  hot: true,
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
