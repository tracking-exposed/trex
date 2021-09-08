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
  const avail = await automo.fetchRecommendations(videoId, 'producer');
  return { json: avail };
};

async function byProfile(req) {
  const avail = await automo.fetchRecommendationsByProfile();
  debug("byProfile (%s) returning without filter %d recommendations",
    req.params.publicKey, avail.length);
  return { json: _.reverse(avail) };
}

async function ogpProxy(req) {
  // please remind, this logic at the moment do not allow OG-refresh
  const descaped = decodeURIComponent(req.params.url);
  debug("ogpProxy: %s", descaped);
  const exists = await automo.getRecommendationByURL(descaped);
  if(exists) {
    debug("Requested OGP to an already acquired URL %s", descaped);
    return {
      json: exists
    }
  }
  const result = await fetchOpengraph.fetch(descaped);
  const review = await automo.saveRecommendationOGP(result);
  if(!review.title) {
    debug("We got an error in OGP (%s) %j", descaped, review);
    return {
      json: {
        error: true,
        missingFields: review
      }
    }
  }
  debug("Fetched correctly %s", descaped);
  return { json: review };
}

async function videoByCreator(req) {
  // this function should validate req.params.authMaterial
  let creator = {};
  if(!req.params.publicKey || !req.params.publicKey.length)
    creator.id = 'dummy';
  else
    creator.id = req.params.publicKey;

  debug("Querying youtube-based-list via profile %s", creator.id);
  const MAXVIDOEL = 100;
  const videos = await automo
    .getVideoFromYTprofiles(creator, MAXVIDOEL);

  // format: recommendation might be empty or unset
  // creatorId, when, videoId, title, recommendations: []
  const ready = _.map(videos, function(v) {
    _.unset(v, '_id');
    if(!v.recommendations)
      v.recommendations = [];
    return v;
  })

  debug("requested Video List by content creator, returning mockup")
  return { json: ready };
}

async function getRecommendationById(req) {
  // this is a public function, anyone can query a recommandation detail
  // this function support a single Id or a list of IDs
  const ids = req.params.id.split(',');
  const recomms = await automo.recommendationById(ids);
  debug("From %d recommendation Id we god %d recommendations found",
    ids.length, recomms.length);
  return { json: recomms };
}

async function updateVideoRec(req) {
  const update = req.body;

  if(!update.creatorId)
    return { json: { error: true, message: "missing creatorId — should be replaced with proper auth"}};

  if(!update.videoId)
    return { json: { error: true, message: "missing videoId" }};

  if(!update.recommendations || !update.recommendations.length)
    update.recommendations = [];

  debug("Updating videoId %s with %d recommendations",
    update.videoId, update.recommendations.length);

  const updated = await automo.updateRecommendations(
    update.videoId, update.recommendations);

  return { json: updated };
};


module.exports = {
  byVideoId,
  byProfile,
  ogpProxy,
  videoByCreator,
  getRecommendationById,
  updateVideoRec,
};