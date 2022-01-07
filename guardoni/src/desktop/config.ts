import { AppEnv } from '../AppEnv';

export const config: AppEnv = {
  VERSION: process.env.VERSION as any,
  NODE_ENV: process.env.NODE_ENV as any,
};
