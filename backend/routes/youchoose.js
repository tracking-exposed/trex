const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('routes:youchoose');
const fetchOpengraph = require('fetch-opengraph');

const automo = require('../lib/automo');
const params = require('../lib/params');
const utils = require('../lib/utils');
const CSV = require('../lib/CSV');

/*  type: 'video', 'wikipedia', 'article', 'tiktok', 'url',
    format: {
        type:
        url:
        fallbackTitle: (title is provided by opengraph or by)
        descriptions: [{
            lang: <lang code>
            onelinemarkdown: ""
        }] <40 chars>,
        type: video/tiktok lead to:
        duration: 'xx',
    } */

async function byVideoId(req) {
  /* this function can be invoked in two ways: POST or GET */
  const source1 = req.params ? _.get(req.params, 'videoId') : null;
  const source2 = req.body ? _.get(req.body, 'videoId') : null;
  const videoId = source1 || source2;
  debug("videoId %s kind %s",
    videoId,
    source1 ? "GET/params" : "POST/body");
  debug("Looking recommendations for videoId %s", videoId);
  const avail = await automo.fetchRecommendations(videoId, 'demo');
  return { json: avail };
};

async function byProfile(req) {
  debug("byProfile (%s)", req.params.publicKey);
  const avail = await automo.fetchRecommendationsByProfile();
  return { json: avail };
}

async function ogpProxy(req) {
  // please remind, this logic at the moment do not allow OG-refresh
  const descaped = decodeURIComponent(req.params.url);
  const exists = await automo.getRecommendationByURL(descaped);
  if(exists) {
    return {
      json: exists
    }
  }
  const result = await fetchOpengraph.fetch(descaped);
  const review = await automo.saveRecommendationOGP(result);
  if(!review.title) {
    debug("We got an error! %s", review);
    return {
      json: {
        error: true,
        missingFields: review
      }
    }
  }
  return { json: review };
}

module.exports = {
  byVideoId,
  byProfile,
  ogpProxy,
};
