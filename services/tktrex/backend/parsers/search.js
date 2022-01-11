const _ = require('lodash');
const debug = require('debug')('parser:search');

const getNatureByHref = require('./shared').getNatureByHref;

function getFullSearchMetadata(renod, order) {
  const vlink = renod.querySelector('a[href^="https://www.tiktok.com/@"]');
  const vhref = vlink.getAttribute('href');
  const vidnat = getNatureByHref(vhref);

  const fdesc = renod.querySelector('[data-e2e="search-card-video-caption"]');
  const textdesc = fdesc.textContent;
  const links = renod.querySelectorAll('a');
  const linked = _.map(links, function (l) {
    const asreported = l.getAttribute('href');
    const tkhref = _.startsWith(asreported, '/')
      ? 'https://www.tiktok.com' + asreported
      : asreported;
    return {
      link: getNatureByHref(tkhref),
      desc: l.textContent,
    };
  });
  const img = renod.querySelector('img');
  const thumbnail = img.getAttribute('src');

  const publishingDate = _.reduce(
    img.parentNode.parentNode.childNodes,
    function (memo, n) {
      if (!memo && n.textContent.trim().match(/(\d{4})-(\d{1,2})-(\d{1,2})/))
        memo = n.textContent;
      return memo;
    },
    null
  );

  return {
    order,
    video: vidnat,
    textdesc,
    linked,
    thumbnail,
    publishingDate: publishingDate
      ? new Date(publishingDate).toISOString()
      : null,
  };
}

/* this is returning a bunch of native information,
 * perhaps might be splitted in appropriate files.
 * videoId, error messages, comment disabled, etc */
function search(envelop, previous) {
  if (previous.nature.type !== 'search') return false;

  /* this piece of code return a list of videos, because
       the search selector is not per video, but per 'body' */
  const descs = envelop.jsdom.querySelectorAll('[data-e2e="search-card-desc"]');
  const results = _.map(descs, function (elem, i) {
    return getFullSearchMetadata(elem.parentNode, i + 1);
  });

  const retval = {};

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

module.exports = search;
