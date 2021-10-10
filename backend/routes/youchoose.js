const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('routes:youchoose');
const fetchOpengraph = require('fetch-opengraph');

const ycai = require('../lib/ycai');
const curly = require('../lib/curly');

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
  const avail = await ycai.fetchRecommendations(videoId, 'producer');
  return { json: avail };
};

async function byProfile(req) {
  const avail = await ycai.fetchRecommendationsByProfile();
  debug("byProfile (%s) returning without filter %d recommendations",
    req.params.publicKey, avail.length);
  return { json: _.reverse(avail) };
}

async function ogpProxy(req) {
  const url = req.body.url;
  debug("ogpProxy: %s", url);
  const exists = await ycai.getRecommendationByURL(url);
  if(exists) {
    debug("Requested OGP to an already acquired URL %s", url);
    return {
      json: exists
    }
  }
  const result = await fetchOpengraph.fetch(url);
  const review = await ycai.saveRecommendationOGP(result);
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
  creator.id = req.params.publicKey;
  // at the moment the publicKey is the channelId

  debug("Querying DB.ytvids for profile [%s]", creator.id);
  const MAXVIDOEL = 100;
  const videos = await ycai
    .getVideoFromYTprofiles(creator, MAXVIDOEL);

  // format: recommendation might be empty or unset
  // creatorId, when, videoId, title, recommendations: []
  const ready = _.map(videos, function(v) {
    _.unset(v, '_id');
    if(!v.recommendations)
      v.recommendations = [];
    return v;
  })

  debug("Requested Video List by content creator (%s) returning %d",
    creator.id, ready.length);

  return { json: ready };
}

async function getRecommendationById(req) {
  // this is a public function, anyone can query a recommandation detail
  // this function support a single Id or a list of IDs
  const ids = req.params.id.split(',');
  const recomms = await ycai.recommendationById(ids);
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

  const updated = await ycai.updateRecommendations(
    update.videoId, update.recommendations);

  return { json: updated };
};

async function creatorRegister(req) {
  const channelId = _.get(req.body, 'channelId');
  if(!channelId || channelId.length < 10)
    return { json: {
        error: true,
        message: "channelId missing?!"
    }};

  const type = _.get(req.body, 'type');
  if(type !== "channel")
    return { json: {
      error: true,
      message: "Not supported type?"
    }};

  const expireAt = moment().add(1, 'month').toISOString();
  const token = await ycai
    .generateToken({input: channelId, type},
      expireAt);

  const matchableToken = `YTTREX-${token}-ENDC0DE`;
  // remind self, if you change these hardcoded strings
  // like YTTREX-ENC0DE, also change on lib/curly.js

  return { json: {
    token: matchableToken,
    expireAt,
  }}
}

async function creatorVerify(req) {

  const channelId = req.body.channelId;
  const code = await curly.tokenFetch(channelId)
  debug("Code retrieved %s", code);

  const expectedToken = await ycai.getToken({
    type: 'channel',
    input: channelId
  });

  if(expectedToken != code) {
    debug("Validation fail: %s != %s", expectedToken, code);
    return { json: {
      error: true,
      message: "code not found!"
    }};
  }

  const titlesandId = await curly.experimentalFetch(channelId)
  // TODO this also has to return any kind of description string
  if(!titlesandId) {
    debug("Failure in extracting video details from channel %s", channelId);
    return { json: { error: true, message: "Failure in extracting info from YouTube; investigate"}}
  } else
    debug("Success in fetching initial video list via curly! %d", titlesandId.length);

  await ycai.registerVideos(titlesandId, channelId);
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
  creatorVerify,
};