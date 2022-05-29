const _ = require('lodash');
const debug = require('debug')('parser:profile');

const getNatureByHref = require('./shared').getNatureByHref;

function getFullProfileMetadata(renod, order) {
  const vlink = renod.querySelector('a[href^="https://www.tiktok.com/@"]');
  const vhref = vlink.getAttribute('href');
  const vidnat = getNatureByHref(vhref);

  const titleel = renod.querySelector('a[title]');
  const title = titleel.getAttribute('title');
  const viewsel = renod.querySelector('[data-e2e="video-views"]');
  const views = viewsel.textContent;
  const img = renod.querySelector('img[alt]');
  const thumbnail = img.getAttribute('src');

  return {
    order,
    video: vidnat,
    title,
    views,
    thumbnail,
  };
}

/* this is returning a bunch of native information,
 * perhaps might be splitted in appropriate files.
 * videoId, error messages, comment disabled, etc */
function profile(envelop, previous) {

  if (previous.nature.type !== 'profile') return false;

  debug("Profile spot! %s", JSON.stringify(previous, undefined, 2));
  /* this piece of code return a list of videos, because
       the search selector is not per video, but per 'body' */
  const descs = envelop.jsdom.querySelectorAll('[data-e2e="user-post-item"]');
  const results = _.map(descs, function (elem, i) {
    return getFullProfileMetadata(elem.parentNode, i + 1);
  });

  const retval = {};

  debug("Video Results found in profile %d", results.length);
  if (results.length) {
    retval.amount = results.length;
    retval.results = results;
  } else {
    const errmsg = 'No results found';
    const h2 = envelop.jsdom.querySelectorAll('h2');
    // there are various 'h2' but only one can be an error
    _.each(h2, function (h) {
      if (errmsg === h.textContent) {
        retval.error = errmsg;
        retval.message = h.parentNode.querySelector('p')?.textContent;
        // it can be 'hateful' or 'violate' but we don't know about other languages
        debug('No results found: found this message: %s', retval.message);
        retval.hatespeech = !!retval?.message?.match(/hateful/);
      }
    });
  }

  return retval;
}

module.exports = profile;
