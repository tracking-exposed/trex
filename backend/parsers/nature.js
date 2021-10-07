const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('parsers:nature');

function nature(envelop, previous) {
/* this parser is meant to analye the URL 
 * and understand which kind of nature has this html */

/* types we want as output:
 * 'foryou', 'following', 
 * 'lists' (user page, search result, music result)
 * 'video' 
 */

  const retval = {};
  const urlO = new URL(envelop.html.href);
  const chunks = urlO.pathname.split('/');

  if(urlO.pathname == "/foryou") {
    retval.type = 'foryou'
  } else if(urlO.pathname == "/") {
    retval.type = 'foryou';
  } else if(urlO.pathname == "/following") {
    retval.type = 'following';
  } else if(chunks[1] === 'video' && chunks.length === 3) {
    // /@timothyfletcher_/video/7014949386434252038?is_from_webapp=v1
    retval.type = 'video';
    retval.videoId = chunks[2];
    retval.authorId = chunks[0];
  } else {
    debug("Unmanaged condition %j", urlO)
    retval = null;
  }
  
  return { nature: retval };
};

module.exports = nature;
