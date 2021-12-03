const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('parsers:nature');

function getNatureByHref(href) {
  /* this piece of code is duplicated in extension/src/app.js */
  try {
    const urlO = new URL(href);
    const chunks = urlO.pathname.split('/');
    const retval = {};

    if(urlO.pathname === "/foryou") {
      retval.type = 'foryou'
    } else if(urlO.pathname === "/") {
      retval.type = 'foryou';
    } else if(urlO.pathname === "/following") {
      retval.type = 'following';
    } else if(chunks[2] === 'video' && chunks.length >= 3) {
      retval.type = 'video';
      retval.videoId = chunks[3];
      retval.authorId = chunks[1];
    } else if(_.startsWith(urlO.pathname, "/@")) {
      retval.type = 'creator';
      retval.creatorName = urlO.pathname.substr(1);
    } else if(urlO.pathname === "/search") {
      retval.type = 'search';
      retval.query = urlO.searchParams.get('q');
      retval.timestamp = urlO.searchParams.get('t');
    } else {
      debug("Unmanaged condition from URL: %o", urlO);
      return null;
    }
    debug("getNatureByHref attributed %o", retval);
    return retval;

  } catch(error) {
    debug("Error in getNatureByHref: %s", error.message);
    return null;
  }
}

function nature(envelop, previous) {
/* this parser is meant to analye the URL 
 * and understand which kind of nature has this html */
  return getNatureByHref(envelop.html.href);
};

module.exports = nature;
