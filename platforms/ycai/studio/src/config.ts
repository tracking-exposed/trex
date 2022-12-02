import { AppEnv } from './AppEnv';

export const config: AppEnv = {
  NODE_ENV: process.env.NODE_ENV as any,
  PUBLIC_URL: process.env.PUBLIC_URL as any,
  API_URL: process.env.API_URL as string,
  DATA_DONATION_FLUSH_INTERVAL:
    process.env.DATA_DONATION_FLUSH_INTERVAL ?? '3000',
  DEBUG: process.env.DEBUG ?? '@YCAI:*:error',
  WEB_URL: process.env.WEB_URL as string,
  BUILD_DATE:
    process.env.BUILD_DATE ?? new Date().toISOString().replace(/\.\d+/, ''),
  VERSION: process.env.VERSION as string,
};
