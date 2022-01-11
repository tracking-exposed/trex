const _ = require('lodash');
const debug = require('debug')('parsers:numbers');

function metrics(envelop, previous) {
  /* only feedId on 'foryou' and 'following' have a description,
     not really because also if you scroll on an user timeline */
  const availin = ['foryou', 'following'];

  if (previous.nature && availin.indexOf(previous.nature.type) === -1) {
    debug('No numbers in previous.nature %o', previous.nature);
    return null;
  }

  const likee = envelop.jsdom.querySelector('[data-e2e="like-count"]');
  const liken = likee.textContent;

  const commente = envelop.jsdom.querySelector('[data-e2e="comment-count"]');
  const commentn = commente.textContent;

  const sharee = envelop.jsdom.querySelector('[data-e2e="share-count"]');
  const sharen = sharee.textContent;

  return {
    metrics: {
      liken,
      commentn,
      sharen,
    },
  };
}

module.exports = metrics;
