import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '.env.development') });

process.env.BUILD_DATE = new Date().toISOString().replace(/\.\d+/, '');
process.env.VERSION = '0.1-TEST';
process.env.API_ROOT = 'http://localhost:9000/api';
process.env.FLUSH_INTERVAL = 3000 as any;
process.env.BUILD = new Date().toISOString();
process.env.DEBUG = '@trex:*,-@trex:API:debug';

// eslint-disable-next-line @typescript-eslint/no-var-requires
Object.assign(global, require('jest-chrome'));
