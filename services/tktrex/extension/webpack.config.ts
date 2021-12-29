import path from 'path';
import moment from 'moment';

import {
  CopyWebpackPlugin,
  FileManagerPlugin,
} from '../../../shared/src/webpack/plugins';

import { getConfig } from '../../../shared/src/webpack/config';

import { AppEnv } from './src/AppEnv';
import packageJSON from './package.json';

const NODE_ENV = process.env.NODE_ENV === 'production' ? 'production' : 'development';
const DEVELOPMENT = NODE_ENV === 'development';
const PRODUCTION = NODE_ENV === 'production';

const PATHS = {
  ENTRY: {
    app: path.resolve(__dirname, 'src/app.ts'),
    popup: path.resolve(__dirname, 'src/chrome/popup/index.tsx'),
    background: path.resolve(__dirname, 'src/chrome/background/index.ts'),
  },
  BUILD: path.resolve(__dirname, 'build'),
  DIST: path.resolve(__dirname, 'dist'),
  NODE_MODULES: path.resolve(__dirname, 'node_modules'),
};

const DEV_SERVER = 'localhost';
const ENV_DEP_SERVER = DEVELOPMENT ? ('http://' + DEV_SERVER + ':14000') : 'https://tiktok.tracking.exposed';
const ENV_DEP_WEB = DEVELOPMENT ? ('http://' + DEV_SERVER + ':1313') : 'https://tiktotk.tracking.exposed';
const LAST_VERSION = 2;
const BUILDISODATE = new Date().toISOString();

process.env.API_ROOT = `${ENV_DEP_SERVER}/api/v${LAST_VERSION}`;
process.env.WEB_ROOT = ENV_DEP_WEB;
process.env.VERSION = `${packageJSON.version}${(DEVELOPMENT ? '-dev' : '')}`;
process.env.BUILD = `On the ${moment().format('DD of MMMM at HH:mm')}.`;
process.env.BUILDISODATE = BUILDISODATE;
process.env.FLUSH_INTERVAL = DEVELOPMENT ? '4500' : '9000';
process.env.DEVELOPMENT = DEVELOPMENT ? 'development' : 'production';

const outputDir = PRODUCTION ? PATHS.DIST : PATHS.BUILD;

const { buildENV, ...config } = getConfig({
  cwd: __dirname,
  outputDir,
  entry: PATHS.ENTRY,
  env: AppEnv,
  hot: false,
});

config.plugins.push(
  new CopyWebpackPlugin({
    patterns: [{
      from: 'src/popup',
    }, {
      from: 'manifest.json',
      transform: (content: Buffer) => {
        const manifest = JSON.parse(content.toString());

        if (NODE_ENV === 'development') {
          manifest.permissions.push('http://localhost:14000/');
        }

        return JSON.stringify(manifest, null, 2);
      },
    }, {
      from: 'icons',
    }],
  }),
);

if (config.mode === 'production') {
  config.plugins.push(
    new FileManagerPlugin({
      events: {
        onEnd: {
          archive: [
            {
              source: outputDir,
              destination: path.join(outputDir, 'extension.zip'),
            },
          ],
        },
      },
    }),
  );
}

// eslint-disable-next-line no-console
console.log({
  buildENV,
});

export default config;
