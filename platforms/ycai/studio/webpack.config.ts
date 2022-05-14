import path from 'path';
import { getConfig } from '../../../packages/shared/src/webpack/config';
import { getExtensionConfig } from '../../../packages/shared/src/webpack/extension.config';
import { CopyWebpackPlugin } from '../../../packages/shared/src/webpack/plugins';
import packageJson from './package.json';
import { AppEnv } from './src/AppEnv';

process.env.VERSION = packageJson.version.replace('-beta', '');

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
        from: path.resolve(__dirname, 'public'),
        filter: (file: string) => {
          const { base } = path.parse(file);
          return !['manifest.json', 'popup.html'].includes(base);
        },
      },
    ],
  })
);

const { buildENV: extensionBuildEnv, ...extensionConfig } = getExtensionConfig(
  'ycai',
  {
    cwd: __dirname,
    env: AppEnv,
    manifestVersion: process.env.VERSION,
    outputDir: path.resolve(__dirname, 'build/extension'),
    distDir: path.resolve(__dirname, 'build/extension'),
    transformManifest: (manifest) => {
      if (config.mode === 'development') {
        manifest.permissions = [
          'http://localhost:9000/',
          ...manifest.permissions,
        ];
      }

      if (buildENV.BUNDLE_TARGET === 'chrome') {
        manifest.cross_origin_embedder_policy = {
          value: 'require-corp',
        };

        manifest.cross_origin_opener_policy = {
          value: 'same-origin',
        };
      }

      return manifest;
    },
  }
);

export default [
  extensionConfig,
  {
    ...config,
    devtool: 'source-map',
    devServer: {
      host: '0.0.0.0',
      port: 3000,
      hot: true,
    },
  },
];
