const _ = require('lodash');
const debug = require('debug')('parsers:author');

function author(envelop, previous) {
  /* only feedId on 'foryou' and 'following' have a description,
     not really because also if you scroll on an user timeline */
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
