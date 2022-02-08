import moment from 'moment';
import path from 'path';
import { getExtensionConfig } from '../../../packages/shared/src/webpack/extension.config';
import packageJSON from './package.json';
import { AppEnv } from './src/AppEnv';

const NODE_ENV =
  process.env.NODE_ENV === 'production' ? 'production' : 'development';
const PRODUCTION = NODE_ENV === 'production';
const DEVELOPMENT = !PRODUCTION;

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
const ENV_DEP_SERVER = DEVELOPMENT
  ? 'http://' + DEV_SERVER + ':14000'
  : 'https://tiktok.tracking.exposed';
const ENV_DEP_WEB = DEVELOPMENT
  ? 'http://' + DEV_SERVER + ':1313'
  : 'https://tiktok.tracking.exposed';
const LAST_VERSION = 2;
const BUILDISODATE = new Date().toISOString();

process.env.API_ROOT = `${ENV_DEP_SERVER}/api/v${LAST_VERSION}`;
process.env.WEB_ROOT = ENV_DEP_WEB;
process.env.VERSION = `${packageJSON.version}${DEVELOPMENT ? '-dev' : ''}`;
process.env.BUILD = `On the ${moment().format('DD of MMMM at HH:mm')}.`;
process.env.BUILDISODATE = BUILDISODATE;
process.env.FLUSH_INTERVAL = DEVELOPMENT ? '4500' : '9000';
process.env.DEVELOPMENT = DEVELOPMENT ? 'development' : 'production';

const outputDir = PRODUCTION ? PATHS.DIST : PATHS.BUILD;
const manifestVersion = (
  process.env.MANIFEST_VERSION ?? packageJSON.version
).replace('-beta', '');

const { buildENV, ...config } = getExtensionConfig('tktrex', {
  cwd: __dirname,
  env: AppEnv,
  outputDir,
  manifestVersion,
  transformManifest: (m) => {
    if (NODE_ENV === 'development') {
      m.permissions.push('http://localhost:14000/');
    }
    return m;
  },
  entry: PATHS.ENTRY,
});

export default config;
