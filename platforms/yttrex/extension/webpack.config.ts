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
// enable data contribution setting when building for "guardoni"
process.env.DATA_CONTRIBUTION_ENABLED = 'false';
if (process.env.BUILD_TARGET === 'guardoni') {
  // eslint-disable-next-line no-console
  console.log(
    'Building extension for guardoni, setting data contribution enabled by default'
  );
  process.env.DATA_CONTRIBUTION_ENABLED = 'true';
}

const APP_VERSION = packageJSON.version
  .replace(/-(beta|\d)/, '')
  .concat(process.env.NODE_ENV === 'production' ? '' : '.99');

const { buildENV, ...extensionConfig } = getExtensionConfig(
  process.env.BUILD_TARGET === 'guardoni' ? 'yttrex-guardoni' : 'yttrex',
  {
    cwd: __dirname,
    entry: {
      app: path.resolve(__dirname, 'src/app/index.ts'),
      popup: path.resolve(__dirname, 'src/popup.tsx'),
      background: path.resolve(__dirname, 'src/background/index.ts'),
    },
    outputDir: path.resolve(__dirname, 'build'),
    distDir: path.resolve(__dirname, 'dist'),
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
        PUBLIC_KEY: t.union([t.string, t.undefined]),
        SECRET_KEY: t.union([t.string, t.undefined]),
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
        manifest.permissions = manifest.permissions
          .filter((p: string) => !p.includes('youtube.tracking.exposed'))
          .concat(['http://localhost:9000/']);
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
