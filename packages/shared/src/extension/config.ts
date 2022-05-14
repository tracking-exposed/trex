export interface Config {
  active: boolean;
  ux: boolean;
  API_ROOT: string;
  BUILD: string;
  DEVELOPMENT: boolean;
  FLUSH_INTERVAL: number;
  VERSION: string;
  BUILD_DATE?: string;
  publicKey?: string;
  WEB_ROOT?: string;
}

if (!process.env.API_ROOT) {
  throw new Error('API_ROOT is not defined');
}

if (!process.env.VERSION) {
  throw new Error('VERSION is not defined');
}

if (!process.env.FLUSH_INTERVAL) {
  throw new Error('FLUSH_INTERVAL is not defined');
}

if (!process.env.BUILD) {
  throw new Error('BUILD is not defined');
}

const config: Config = {
  active: process.env.DATA_CONTRIBUTION_ENABLED === 'true',
  ux: false,
  BUILD: process.env.BUILD,
  BUILD_DATE: process.env.BUILD_DATE,
  DEVELOPMENT: process.env.NODE_ENV === 'development',
  FLUSH_INTERVAL: parseInt(process.env.FLUSH_INTERVAL, 10),
  API_ROOT: process.env.API_ROOT,
  VERSION: process.env.VERSION,
  WEB_ROOT: process.env.WEB_ROOT,
};

export default config;
