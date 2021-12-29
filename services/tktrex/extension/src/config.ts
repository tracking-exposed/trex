export interface Config {
  active: boolean;
  ux: boolean;
  API_ROOT: string;
  BUILD?: string;
  BUILDISODATE?: string;
  DEVELOPMENT: boolean;
  FLUSH_INTERVAL: number;
  publicKey?: string;
  VERSION: string;
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

const config: Config = {
  active: true,
  ux: false,
  BUILD: process.env.BUILD,
  BUILDISODATE: process.env.BUILDISODATE,
  DEVELOPMENT: process.env.NODE_ENV === 'development',
  FLUSH_INTERVAL: parseInt(process.env.FLUSH_INTERVAL, 10),
  API_ROOT: process.env.API_ROOT,
  VERSION: process.env.VERSION,
  WEB_ROOT: process.env.WEB_ROOT,
};

export default config;
