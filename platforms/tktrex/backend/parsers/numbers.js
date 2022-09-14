async function metrics(envelop, previous) {
  /* 2.4.x 'foryou' and 'following' are considered only */
  const availin = ['foryou', 'following', 'video', 'native'];

  if (previous.nature && availin.indexOf(previous.nature.type) === -1) {
    // debug('No numbers in previous.nature %o', previous.nature);
    return null;
  }

  let likee, commente;
  if (previous.nature.type === 'native') {
    likee = envelop.jsdom.querySelector(
      'div[class*="DivBrowserModeContainer"] [data-e2e*="like-count"]'
    );
    commente = envelop.jsdom.querySelector(
      'div[class*="DivBrowserModeContainer"] [data-e2e*="comment-count"]'
    );
  } else {
    likee = envelop.jsdom.querySelector('[data-e2e="like-count"]');
    commente = envelop.jsdom.querySelector('[data-e2e="comment-count"]');
  }

  const liken = likee.textContent;
  const commentn = commente.textContent;

  const sharee = envelop.jsdom.querySelector('[data-e2e="share-count"]');
  const sharen = sharee.textContent;

  return {
    liken,
    commentn,
    sharen,
  };
}

module.exports = metrics;
