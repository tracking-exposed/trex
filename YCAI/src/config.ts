if (process.env.BUILD_DATE === undefined) {
  throw new Error('BUILD_DATE is not defined');
}

if (process.env.VERSION === undefined) {
  throw new Error('VERSION is not defined');
}

export const config = {
  NODE_ENV: process.env.NODE_ENV,
  API_URL: process.env.API_URL,
  DATA_DONATION_FLUSH_INTERVAL: process.env.DATA_DONATION_FLUSH_INTERVAL ?? '3000',
  LOGGER: process.env.LOGGER ?? '@ycai:*',
  WEB_URL: process.env.WEB_URL,
  BUILD_DATE: process.env.BUILD_DATE,
  VERSION: process.env.VERSION,
};
