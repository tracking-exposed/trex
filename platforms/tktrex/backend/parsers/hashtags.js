const _ = require('lodash');
const debug = require('debug')('parsers:hashtags');

function hashtags(envelop, previous) {
  /* only feed 'foryou' and 'following' have a description */
  const availin = ['foryou', 'following'];

  if (previous.nature && availin.indexOf(previous.nature.type) === -1) {
    // debug('No hashtags for previous.nature %o', previous.nature);
    return null;
  }

  const hashtags = envelop.jsdom.querySelectorAll('a[href^="/tag/"]');
  const results = _.map(hashtags, function (anode) {
    return anode.textContent;
  });

  debug('TAGs %j', results);

  if (results.length) return { hashtags: results };
  else return null;
}

module.exports = hashtags;
