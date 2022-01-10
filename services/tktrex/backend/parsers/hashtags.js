const _ = require('lodash');
const debug = require('debug')('parsers:hashtags');

function hashtags(envelop, previous) {
  /* only feedId on 'foryou' and 'following' have a description,
     not really because also if you scroll on an user timeline */
  const availin = ['foryou', 'following', 'search'];

  debugger;
  if (previous.nature && availin.indexOf(previous.nature.type) === -1) {
    debug('No hashtag for previous.nature %o', previous.nature);
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
