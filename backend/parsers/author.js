const _ = require('lodash');
const debug = require('debug')('parsers:author');

function author(envelop, previous) {

  /* only feedId on 'foryou' and 'following' have a description,
     not really because also if you scroll on an user timeline */
  const availin = ["foryou", "following"];

  if(previous.nature && availin.indexOf(previous.nature.type) === -1) {
    debug("No hashtag for previous.nature %o", previous.nature);
    return null;
  }

  const username = envelop.jsdom.querySelector('a > h3');
  const name = envelop.jsdom.querySelector('a > h4');

  if(username && name) {
    const link = name.parentNode.getAttribute('href');
    return {
      author: {
        link,
        name: name.textContent.trim(),
        username: username.textContent.trim(),
      }
    }
  }
  /* else we fail to find it */
};

module.exports = author;
