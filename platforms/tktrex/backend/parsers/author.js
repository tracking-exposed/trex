async function author(envelop, previous) {
  /* 2.4.x author description works only in the following cases */
  const availin = ['foryou', 'following', 'search', 'native', 'video'];

  if (previous.nature && availin.indexOf(previous.nature.type) === -1) {
    // debug('No hashtag for previous.nature %o', previous.nature);
    return null;
  }

  /*
  const images = envelop.jsdom.querySelectorAll('img');
  _.each(images, function(i) {
    debug("IMAGE: %s", i.getAttribute('src'));
  }) */

  let usernameElt, nameElt;
  if (previous.nature.type === 'native') {
    usernameElt = envelop.jsdom.querySelector(
      'div[class*="DivBrowserModeContainer"] [data-e2e="browse-username"]'
    );
  } else {
    usernameElt = envelop.jsdom.querySelector(
      '[data-e2e="video-author-uniqueid"], [data-e2e="search-card-user-unique-id"]'
    );
    nameElt = envelop.jsdom.querySelector('a > h4');
  }

  if (usernameElt) {
    const username = usernameElt.textContent.trim();

    const author = {
      link: `/@${username}`,
      username,
    };

    if (nameElt) {
      author.name = nameElt.textContent.trim();
    }

    return author;
  }
  /* else we fail to find it */
  return null;
}

module.exports = author;
