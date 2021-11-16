const _ = require('lodash');
const debug = require('debug')('routes:opendata');

const ycai = require('../lib/ycai');

const PUBLIC_AMOUNT_ELEMS = 100;

async function opendataChannel(req) {
  /* this function is invoked from our APIs to get info on newly subscribed channels, and
   * run guardoni so to get some observation on them */

  const details = req.params.details;

  debug("Requested opendata on channels (details: %s)", details);
  if(details === "count") {
    const data = await ycai.getRecentChannels(PUBLIC_AMOUNT_ELEMS, true);
    debug("Retrieved %d recent channels and their recommendations", data.length );
    return { json: data }
  } else {
    const urls = await ycai.getRecentChannels(PUBLIC_AMOUNT_ELEMS, false);
    debug("Retrieved %d recent channels", urls.length );
    return { json: urls }
  }
}

module.exports = {
  opendataChannel,
};
