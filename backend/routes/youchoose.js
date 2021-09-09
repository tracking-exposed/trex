const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('routes:youchoose');
const fetchOpengraph = require('fetch-opengraph');
const { curly } = require('node-libcurl');

const automo = require('../lib/automo');
const params = require('../lib/params');
const utils = require('../lib/utils');
const CSV = require('../lib/CSV');

async function byVideoId(req) {
  /* this function can be invoked in two ways: POST or GET */
  const source1 = req.params ? _.get(req.params, 'videoId') : null;
  const source2 = req.body ? _.get(req.body, 'videoId') : null;
  const videoId = source1 || source2;
  debug("videoId %s kind %s",
    videoId,
    source1 ? "GET/params" : "POST/body");
  if(!videoId) {
    debug("Missing mandatory parameter: videoId (%s)", JSON.stringify(req));
    return { json: { error: true, message: "missing videoId"}}
  }
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
  const url = req.body.url;
  debug("ogpProxy: %s", url);
  const exists = await automo.getRecommendationByURL(url);
  if(exists) {
    debug("Requested OGP to an already acquired URL %s", url);
    return {
      json: exists
    }
  }
  const result = await fetchOpengraph.fetch(url);
  const review = await automo.saveRecommendationOGP(result);
  if(!review.title) {
    debug("We got an error in OGP (%s) %j", url, review);
    return {
      json: {
        error: true,
        missingFields: review
      }
    }
  }
  debug("Fetched correctly %s", url);
  return { json: review };
}

async function videoByCreator(req) {
  // this function should validate req.params.authMaterial
  let creator = {};
  if(!req.params.publicKey || !req.params.publicKey.length) {
    debug("Warning: hardcoding 'uno' because the params wasn't supply!");
    creator.id = 'uno';
  }
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
  debug("getRecommendationById (%d ids) found %d",
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

  if(_.find(update.recommendations, function(e) {
    return !(_.isString(e) && e.length === 40)
  }))
    return { json: { error: true, message: "validation fail in recommendation list"}};

  debug("Updating videoId %s with %d recommendations",
    update.videoId, update.recommendations.length);

  const updated = await automo.updateRecommendations(
    update.videoId, update.recommendations);

  return { json: updated };
};

async function creatorRegister(req) {
  // Questa funzione potrebbe essere instabile
  // Permettendoci una licenza poetica:
  // Stà come d'autuno, sugli alberi, ed è una foglia secca con sopra un bruco affamato.
  const channelId = req.params.channelId;
  const ytvidsurl = `https://www.youtube.com/channel/${channelId}/videos`;
  const { statusCode, data, headers } = await curly.get(ytvidsurl, {
    verbose: true,
    timeoutMs: 4000,
    sslVerifyPeer: false,
    followLocation: true
  });

  debug("CURL from youtube %d", statusCode);
  const largestr = data.split('ytInitialData = ')[1].replace(/}};<\/script>.*/g, '}}');
  const blob = JSON.parse(largestr);
  const videob = _.filter(blob.contents.twoColumnBrowseResultsRenderer.tabs,
    function(tabSlot) {
      if(tabSlot.tabRenderer &&
        tabSlot.tabRenderer.title)
          debug("%s", tabSlot.tabRenderer.title);
      return (tabSlot.tabRenderer &&
        tabSlot.tabRenderer.title &&
        tabSlot.tabRenderer.title === 'Video');
  });
  if(!videob.length) {
    debug("Not found the expected piece in channel %s", channelId);
    return { json: { error: true, message: "debug this YouTube behavior!"}}
  }
  const videonfo = videob[0].tabRenderer.content.sectionListRenderer.contents[0].itemSectionRenderer.contents[0].gridRenderer.items;
  const videtails = _.compact(_.map(videonfo, function(ve) { return ve.gridVideoRenderer }));
  const titlesandId = _.map(videtails, function(ve) { return { videoId: ve.videoId, title: ve.title.runs[0].text }})

  if(titlesandId.length === 0) {
    debug("Not found the video details in channel %s", channelId);
    return { json: { error: true, message: "debug this YouTube behavior!"}}
  }
  await automo.registerVideos(titlesandId, channelId);
  return { json: titlesandId };
};


module.exports = {
  byVideoId,
  byProfile,
  ogpProxy,
  videoByCreator,
  getRecommendationById,
  updateVideoRec,
  creatorRegister,
};