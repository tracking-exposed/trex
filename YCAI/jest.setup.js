const { chrome } = require('jest-chrome/lib/index.cjs');
const { SVGPathElement } = require('svgdom');

process.env.REACT_APP_BUILD_DATE = new Date().toISOString();
process.env.REACT_APP_VERSION = '0.1-TEST';

Object.assign((global.chrome = {}), chrome);
Object.assign((global.browser = {}), chrome);

global.window.SVGPathElement = SVGPathElement;
