const _ = require('lodash');
const debug = require('debug')('parsers:hashtags');

async function hashtags(envelop, previous) {
  /* only feed 'foryou' and 'following' have a description */
  const availin = ['foryou', 'following', 'video', 'native'];

  if (previous.nature && availin.indexOf(previous.nature.type) === -1) {
    // debug('No hashtags for previous.nature %o', previous.nature);
    return null;
  }

  let hashtags;
  if (previous.nature.type === 'native') {
    hashtags = envelop.jsdom.querySelectorAll(
      'div[class*="DivBrowserModeContainer"] a[href^="/tag/"]'
    );
  } else {
    hashtags = envelop.jsdom.querySelectorAll('a[href^="/tag/"]');
  }
  const results = _.map(hashtags, function (anode) {
    if (anode.textContent.length > 1) return anode.textContent;
  });

  if (results.length) {
    debug('hashtags %d %j', results.length, results);
    return results;
  }

  return null;
}

module.exports = hashtags;
