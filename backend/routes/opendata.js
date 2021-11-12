const _ = require('lodash');
const debug = require('debug')('routes:opendata');

const ycai = require('../lib/ycai');

const PUBLIC_AMOUNT_ELEMS = 100;

async function opendataChannel(req) {
  /* this function is invoked from our APIs to get info on newly subscribed channels, and
   * run guardoni so to get some observation on them */

  const urls = await ycai.getRecentChannels(PUBLIC_AMOUNT_ELEMS);
  debug("Retrieved %d recent channels", urls.length );
  return { json: urls }
}

module.exports = {
  opendataChannel,
};
