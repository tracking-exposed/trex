// load the content of .env file in process.env
require('dotenv/config')
const { chrome } = require('jest-chrome/lib/index.cjs');
const { SVGPathElement } = require('svgdom');

process.env.BUILD_DATE = new Date().toISOString();
process.env.VERSION = '0.1-TEST';
process.env.API_URL = process.env.API_URL ?? 'http://localhost:9000/api';

// patch global object with chrome api
const { chrome } = require('jest-chrome/lib/index.cjs');
Object.assign((global.chrome = {}), chrome);
Object.assign((global.browser = {}), chrome);

global.window.SVGPathElement = SVGPathElement;
