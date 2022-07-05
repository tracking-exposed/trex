import path from 'path';

const envPath = path.resolve(__dirname, '.env.development')

require('dotenv').config({ path: envPath });

process.env.DEBUG = 'guardoni*,@trex*'//-guardoni:debug;
