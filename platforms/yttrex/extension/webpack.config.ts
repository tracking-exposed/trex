import { getExtensionConfig } from '../../../packages/shared/src/webpack/extension.config';
import dotenv from 'dotenv';
import * as t from 'io-ts';
import * as path from 'path';
import { BooleanFromString } from 'io-ts-types/lib/BooleanFromString';
import { NumberFromString } from 'io-ts-types/lib/NumberFromString';
import packageJSON from './package.json';

dotenv.config({
  path: path.resolve(__dirname, process.env.DOTENV_CONFIG_PATH ?? '.env'),
});

const APP_VERSION = packageJSON.version
  .replace(/-(beta|\d)/, '')
  .concat(process.env.NODE_ENV === 'development' ? '-dev' : '');

const { buildENV, ...extensionConfig } = getExtensionConfig(
  process.env.GUARDONI_TARGET ? 'yttrex-guardoni' : 'yttrex',
  {
    cwd: __dirname,
    entry: {
      app: path.resolve(__dirname, 'src/app.ts'),
      popup: path.resolve(__dirname, 'src/chrome/popup/index.js'),
      background: path.resolve(__dirname, 'src/chrome/background/index.ts'),
    },
    outputDir: path.resolve(__dirname, 'build'),
    env: t.strict(
      {
        DEBUG: t.string,
        NODE_ENV: t.union([t.literal('development'), t.literal('production')]),
        API_ROOT: t.string,
        WEB_ROOT: t.string,
        VERSION: t.string,
        BUILD: t.string,
        BUILD_DATE: t.string,
        FLUSH_INTERVAL: NumberFromString,
        DATA_CONTRIBUTION_ENABLED: BooleanFromString,
      },
      'YTTrExAppEnv'
    ),
    manifestVersion: APP_VERSION,
    transformManifest: (manifest) => {
      manifest.version = APP_VERSION;

      if (extensionConfig.mode === 'production') {
        manifest.permissions = manifest.permissions.filter(
          (p: string) => !p.includes('localhost')
        );
      } else if (extensionConfig.mode === 'development') {
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

export default extensionConfig;
