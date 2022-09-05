const _ = require('lodash');
const debug = require('debug')('parsers:author');

async function author(envelop, previous) {
  /* 2.4.x author description works only in the following cases */
  const availin = ['foryou', 'following', 'search'];

  if (previous.nature && availin.indexOf(previous.nature.type) === -1) {
    // debug('No hashtag for previous.nature %o', previous.nature);
    return null;
  }

  /*
  const images = envelop.jsdom.querySelectorAll('img');
  _.each(images, function(i) {
    debug("IMAGE: %s", i.getAttribute('src'));
  }) */

  const usernameElt = envelop.jsdom.querySelector(
    '[data-e2e="video-author-uniqueid"], [data-e2e="search-card-user-unique-id"]'
  );
  const nameElt = envelop.jsdom.querySelector('a > h4');

  if (usernameElt) {
    const username = usernameElt.textContent.trim();

    const author = {
      link: `/@${username}`,
      username,
    };

    if (nameElt) {
      author.name = nameElt.textContent.trim();
    }

    return { author };
  }
  /* else we fail to find it */
}

module.exports = author;
