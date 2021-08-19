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

  debug("Looking recommendations for videoId %s", videoId);
  return { json: []};
};

async function ogpProxy(req) {
  const descaped = decodeURIComponent(req.params.url);
  debug(descaped);
  const result = await fetchOpengraph.fetch(descaped);
  debug(result);
  return { json: result };
}

module.exports = {
  byVideoId,
  ogpProxy,
};
