import path from 'path';
import { getExtensionConfig } from '../../../packages/shared/src/webpack/extension.config';
import packageJSON from './package.json';
import { AppEnv } from './src/AppEnv';
import dotenv from 'dotenv';

dotenv.config({
  path: path.resolve(__dirname, process.env.DOTENV_CONFIG_PATH ?? '.env'),
});

const PRODUCTION = process.env.NODE_ENV === 'production';

const PATHS = {
  ENTRY: {
    app: path.resolve(__dirname, 'src/app/index.ts'),
    popup: path.resolve(__dirname, 'src/popup.ts'),
    background: path.resolve(__dirname, 'src/background/index.ts'),
    injected: path.resolve(__dirname, 'src/injected.ts'),
    interceptor: path.resolve(__dirname, 'src/interceptor/index.ts'),
  },
  BUILD: path.resolve(__dirname, 'build'),
  DIST: path.resolve(__dirname, 'dist'),
  NODE_MODULES: path.resolve(__dirname, 'node_modules'),
};

const outputDir = PRODUCTION ? PATHS.DIST : PATHS.BUILD;

const APP_VERSION = packageJSON.version
  .replace(/-(beta|\d)/, '')
  .concat(process.env.NODE_ENV === 'production' ? '' : '.99');

// enable data contribution setting when building for "guardoni"
process.env.DATA_CONTRIBUTION_ENABLED = 'false';
if (process.env.BUILD_TARGET === 'guardoni') {
  // eslint-disable-next-line no-console
  console.log(
    'Building extension for guardoni, setting data contribution enabled by default',
  );
  process.env.DATA_CONTRIBUTION_ENABLED = 'true';
}

const { buildENV, ...config } = getExtensionConfig(
  process.env.BUILD_TARGET === 'guardoni' ? 'tktrex-guardoni' : 'tktrex',
  {
    cwd: __dirname,
    env: AppEnv,
    outputDir,
    distDir: PATHS.DIST,
    manifestVersion: APP_VERSION,
    transformManifest: (m) => {
      if (!PRODUCTION) {
        m.permissions.push('http://localhost:14000/');
      }
      return m;
    },
    entry: PATHS.ENTRY,
  },
);

export default config;
