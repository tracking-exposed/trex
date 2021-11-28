const _ = require('lodash');
const debug = require('debug')('parsers:music');

function music(envelop, previous) {

  /* only feedId on 'foryou' and 'following' have a description,
     not really because also if you scroll on an user timeline */
  const availin = ["foryou", "following"];

  if(previous.nature && availin.indexOf(previous.nature.type) === -1) {
    debug("No music for previous.nature %o", previous.nature);
    return null;
  }

  const elem = envelop.jsdom.querySelector('a[href^="/music/"]');

  if(!elem) {
    debug("No music in tiktok!? investigate %s", envelop.source.html.id);
    return null;
  }

  const url = elem.getAttribute('href');
  const name = elem.textContent;

  return {
    url,
    name
  };
};

module.exports = music;
