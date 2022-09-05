const debug = require('debug')('parser:native');
// const _ = require('lodash');

async function video(envelop, previous) {
  if (envelop.html.type !== 'native') {
    return null;
  }

  debug('should be implemented');
  return null;
}

module.exports = video;
