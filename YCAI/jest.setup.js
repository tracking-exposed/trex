const { chrome } = require('jest-chrome/lib/index.cjs');

Object.assign((global.chrome = {}), chrome);
Object.assign((global.browser = {}), chrome);
