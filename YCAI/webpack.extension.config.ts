import { AppEnv } from './src/AppEnv';
import { getConfig } from '../packages/shared/src/webpack/config';
import {
  CopyWebpackPlugin,
  FileManagerPlugin,
} from '../packages/shared/src/webpack/plugins';
import * as path from 'path';
import pkgJson from './package.json';

const manifestVersion = (
  process.env.MANIFEST_VERSION ?? pkgJson.version
).replace('-beta', '');

process.env.VERSION = manifestVersion;

const { buildENV, ...config } = getConfig({
  cwd: __dirname,
  target: 'web',
  outputDir: path.resolve(__dirname, 'build/extension'),
  env: AppEnv,
  hot: false,
  entry: {
    ext: path.resolve(__dirname, 'src/app.tsx'),
    popup: path.resolve(__dirname, 'src/popup.tsx'),
    background: path.resolve(__dirname, 'src/background/index.ts'),
  },
});

config.devtool = config.mode === 'development' ? 'inline-source-map' : false;

config.plugins.push(
  new CopyWebpackPlugin({
    patterns: [
      {
        from: 'public',
        filter: (file: string) => {
          const { base } = path.parse(file);
          return !['manifest.json', 'index.html'].includes(base);
        },
      },
      {
        from: 'public/manifest.json',
        transform: (content: Buffer) => {
          const manifest = JSON.parse(content.toString());

          if (buildENV.BUNDLE_TARGET === 'chrome') {
            manifest.cross_origin_embedder_policy = {
              value: 'require-corp',
            };

            manifest.cross_origin_opener_policy = {
              value: 'same-origin',
            };
          }

          manifest.version = manifestVersion;

          return JSON.stringify(manifest, null, 2);
        },
      },
    ],
  })
);

if (config.mode === 'production') {
  config.plugins.push(
    new FileManagerPlugin({
      events: {
        onEnd: {
          archive: [
            {
              source: './build/extension',
              destination: `./build/extension/ycai-extension-${manifestVersion}.zip`,
            },
          ],
        },
      },
    })
  );
}

export default config;
