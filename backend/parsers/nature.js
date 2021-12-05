const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('parsers:nature');
const getNatureByHref = require('./shared').getNatureByHref;


function nature(envelop, previous) {
/* this parser is meant to analye the URL 
 * and understand which kind of nature has this html */
  return getNatureByHref(envelop.html.href);
};

module.exports = nature;
