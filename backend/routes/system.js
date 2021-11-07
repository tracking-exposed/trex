const _ = require('lodash');
const nconf = require('nconf');
const debug = require('debug')('routes:system');

async function systemInfo(req) {
  const reqtype = req.params.type || "default";

  debug("Requested %s", reqtype);
  /* default return the 'gitlog' other might follow */

  const gl = nconf.get('gitlog');
  if(!gl.length)
    return {
      text: "The backend have been started without the standard command so this API can't provide complete information"
    };
  else
    return {
      // HTML standards you say? HAHAAHAHAH
      text: "<html><body><pre>" + gl
    };
}

module.exports = {
  systemInfo
};
