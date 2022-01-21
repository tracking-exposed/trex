const _ = require('lodash');
const debug = require('debug')('parsers:description');

function videoDescriptionGuess(envelop) {
  const uno = envelop.jsdom.querySelector('[data-e2e="browse-video-desc"]');
  const due = envelop.jsdom.querySelector('[data-e2e="video-desc"]');
  const tre = envelop.jsdom.querySelectorAll('img');
  const tops = _.sortBy(tre, function (i) {
    const alt = i.getAttribute('alt');
    return alt?.length;
  });
  console.log(tops);
  let retval = null;
  if (uno) {
    debug("first condition happened in this 'video'");
    retval = { description: uno.textContent };
  } else if (due) {
    debug("second condition happened in this 'video'");
    retval = { description: due.textContent };
  } else if (tre && tre.getAttribute) {
    debug("third condition happened in this 'video'");
    retval = { description: tre.getAttribute('alt') };
  } else {
    debug("only failure condition in this 'video' %s %s %s", uno, due, tre);
    console.log(envelop.jsdom.querySelector('body').outerHTML);
    return null;
  }
  debug('Retval is %o', retval);
  return retval;
}

function description(envelop, previous) {
  /* the 'video' have a different structure and should be better
   * handled this diversity of possibility */
  if (previous.nature && previous.nature.type === 'video') {
    return videoDescriptionGuess(envelop);
  }

  /* otherwise 'foryou' and 'following' have a description */
  const availin = ['foryou', 'following'];

  if (previous.nature && availin.indexOf(previous.nature.type) === -1) {
    debug('No description for previous.nature %o', previous.nature);
    return null;
  }

  const spans = envelop.jsdom.querySelectorAll('span');
  const texts = _.map(spans, function (span) {
    return span.textContent;
  });

  const fullText = envelop.jsdom.querySelector(
    '[data-e2e="video-desc"], [data-e2e="search-card-video-caption"]'
  ).textContent;

  debug('bareText: %j fullText [%s]', _.compact(texts), fullText);
  const nohashtagText = texts.join('').trim();

  return {
    description: fullText,
    baretext: nohashtagText,
  };
}

module.exports = description;
