const debug = require('debug')('parsers:music');

async function music(envelop, previous) {
  /* 'foryou' 'following' and 'video' shares same pattern */
  const availin = ['foryou', 'following', 'video'];

  if (previous.nature && availin.indexOf(previous.nature.type) === -1) {
    // debug("No music for previous.nature %o", previous.nature);
    return null;
  }

  const elem = envelop.jsdom.querySelector('a[href^="/music/"]');

  if (!elem) {
    debug(
      'No music in a tiktok!? investigate: %s %d',
      envelop.html.id,
      envelop.html.html.length
    );
    return null;
  }

  const url = elem.getAttribute('href');
  const name = elem.textContent;

  return {
    url,
    name,
  };
}

module.exports = music;
