const _ = require("lodash");
const moment = require("moment");
const debug = require("debug")("routes:youchoose");
const fetchOpengraph = require("fetch-opengraph");

const ycai = require("../lib/ycai");
const curly = require("../lib/curly");
const endpoints = require("../lib/endpoint");
const { v3 } = require("../endpoints");
const structured = require('../lib/structured');

const PUBLIC_AMOUNT_ELEMS = 100;

async function byVideoId(req) {
  /* this function can be invoked in two ways: POST or GET */
  const source1 = req.params ? _.get(req.params, "videoId") : null;
  const source2 = req.body ? _.get(req.body, "videoId") : null;
  const videoId = source1 || source2;
  debug("videoId %s kind %s", videoId, source1 ? "GET/params" : "POST/body");
  if (!videoId) {
    debug("Missing mandatory parameter: videoId (%s)", JSON.stringify(req));
    return { json: { error: true, message: "missing videoId" } };
  }
  debug("Looking recommendations for videoId %s", videoId);
  const avail = await ycai.fetchRecommendations(videoId, "producer");
  return { json: avail };
}

async function byProfile(req) {
  const avail = await ycai.fetchRecommendationsByProfile();
  debug(
    "byProfile (%s) returning without filter %d recommendations",
    req.params.publicKey,
    avail.length
  );
  return { json: _.reverse(avail) };
}

async function ogpProxy(req) {
  const url = req.body.url;
  debug("ogpProxy: %s", url);
  const exists = await ycai.getRecommendationByURL(url);
  if (exists) {
    debug("Requested OGP to an already acquired URL %s", url);
    return {
      json: exists,
    };
  }
  const result = await fetchOpengraph.fetch(url);
  const review = await ycai.saveRecommendationOGP(result);
  if (!review.title) {
    debug("We got an error in OGP (%s) %j", url, review);
    return {
      json: {
        error: true,
        missingFields: review,
      },
    };
  }
  debug("Fetched correctly %s", url);
  return { json: review };
}

async function videoByCreator(req) {
  // this function should validate req.params.authMaterial
  const decodedReq = endpoints.decodeRequest(v3.Endpoints.Creator.CreatorVideos, req);
  if (decodedReq.type === 'error') {
    return {
      json: {
        error: true,
        details: decodedReq.result
      }
    }
  }
  const token = decodedReq.result.headers['x-authorization'];
  const creator = await ycai.getCreatorByToken(token);
  // at the moment the publicKey is the channelId

  debug("Querying DB.ytvids for profile [%s]", creator._id);
  const MAXVIDOEL = 100;
  const videos = await ycai.getVideoFromYTprofiles({ id: creator.channelId }, MAXVIDOEL);

  // format: recommendation might be empty or unset
  // creatorId, when, videoId, title, recommendations: []
  const ready = _.map(videos, function (v) {
    _.unset(v, "_id");
    if (!v.recommendations) v.recommendations = [];
    return v;
  });

  debug(
    "Requested Video List by content creator (%s) returning %d",
    creator.id,
    ready.length
  );

  return { json: ready };
}

async function repullByCreator(req) {
  const decodedReq = endpoints.decodeRequest(v3.Endpoints.Creator.PullCreatorVideos, req);
  if (decodedReq.type === 'error') {
    return { json: {
      error: true,
      details: decodedReq.result
      }
    }
  }
  const token = decodedReq.result.headers['x-authorization'];
  debug("repullByCreator token %s", token)
  const creator = await ycai.getCreatorByToken(token);
  debug("repullByCreator %j", creator)
  const titlesandId = await curly.recentVideoFetch(creator.channelId);
  debug("repull of %j", titlesandId);
  await ycai.registerVideos(titlesandId, creator.channelId);
  return { json: titlesandId };
}

async function getRecommendationById(req) {
  // this is a public function, anyone can query a recommandation detail
  // this function support a single Id or a list of IDs
  const paramsResult = endpoints.decodeRequest(v3.Endpoints.Public.GetRecommendations, req);
  debug("params result %O", paramsResult);
  if (paramsResult.type === 'error') {
    return {
      json: paramsResult,
    };
  }
  const ids = paramsResult.result.params.ids.split(",");

  const limit = paramsResult.result.query.limit
  const recomms = await ycai.recommendationById(ids, limit);
  debug("getRecommendationById (%d ids) found %d", ids.length, recomms.length);
  return { json: recomms };
}

async function updateVideoRec(req) {
  const update = req.body;

  if (!update.creatorId)
    return {
      json: {
        error: true,
        message: "missing creatorId — should be replaced with proper auth",
      },
    };

  if (!update.videoId)
    return { json: { error: true, message: "missing videoId" } };

  if (!update.recommendations || !update.recommendations.length)
    update.recommendations = [];

  if (
    _.find(update.recommendations, function (e) {
      return !(_.isString(e) && e.length === 40);
    })
  )
    return {
      json: { error: true, message: "validation fail in recommendation list" },
    };

  debug(
    "Updating videoId %s with %d recommendations",
    update.videoId,
    update.recommendations.length
  );

  const updated = await ycai.updateRecommendations(
    update.videoId,
    update.recommendations
  );

  return { json: updated };
}

async function creatorRegister(req) {
  const channelId = _.get(req.params, "channelId");
  if (!channelId || channelId.length < 10)
    return {
      json: {
        error: true,
        message: "channelId missing?!",
      },
    };

  const type = _.get(req.body, "type");
  if (type !== "channel")
    return {
      json: {
        error: true,
        message: "Not supported type?",
      },
    };

  const expireAt = moment().add(1, "week").toISOString();
  const verificationToken = await ycai.generateToken(
    { channelId, type },
    expireAt
  );

  // remind self:
  // if you change these hardcoded strings update lib/curly.js too
  return {
    json: {
      verificationToken,
      tokenString: `[youchoose:${verificationToken}]`,
      channelId,
      expireAt,
      verified: false,
    },
  };
}

async function creatorVerify(req) {
  const channelId = req.params.channelId;
  debug("Fetching youtube.com while looking for the token string!");
  const pageData = await curly.tokenFetch(channelId);
  debug("Code retrieved %s", pageData.code);

  const tokeno = await ycai.getToken({
    type: "channel",
    channelId,
  });

  if (tokeno.verificationToken != pageData.code) {
    debug("Validation fail: %s != %s", tokeno.verificationToken, pageData.code);
    return {
      json: {
        error: true,
        message: "code not found!",
      },
    };
  }

  debug("Validated token, invoking creation with token %o page info %o", tokeno, pageData);
  try {
    // two action happens in this function:
    // 1) remove the token
    // 2) create a 'creator' entry with the new auth material
    const creator = await ycai.confirmCreator(tokeno, pageData);
    return {
      json: creator
    };
  } catch(error) {
    return {
      json: {
        error: true,
        message: error.message,
      }
    }
  }
}

async function creatorGet(req) {
  // this is the /v3/creator/me query, it looks into 
  // 'creators' mongodb collection.

  const decodedReq = endpoints.decodeRequest(v3.Endpoints.Creator.GetCreator, req);
  if (decodedReq.type === 'error') {
    return {
      json: {
        error: true,
        details: decodedReq.result
      }
    }
  }
  const verificationToken = decodedReq.result.headers["x-authorization"];
  // const channelId = req.headers.channelId;
  // if(!channelId && !verificationToken)
  //   return { json: { error: true, message: "missing channelId or verificationToken in the header"}};

  debug("getCreator by token %s", verificationToken);
  const infoavail = await ycai.getCreatorByToken(verificationToken);
  const validatedc = endpoints.decodeResponse(v3.Endpoints.Creator.GetCreator, {...infoavail, registeredOn: infoavail.registeredOn.toISOString() });

  if(validatedc.type === 'error') {
    debug("Invalid generated output for creatorGet %O", validatedc);
    return { json: {
        details: validatedc.result
      }
    }
  }
  return { json: validatedc.result };
}

async function creatorDelete(req) {
  // this function is invoked when a content creator wants to 
  // delete every data on their belong
  console.log("TODO: Not implemented nor yet specify")
  return true;
}

async function getCreatorStats(req) {
  const amount = PUBLIC_AMOUNT_ELEMS;
  const skip = 0;
  debug("TODO glue stats by auth %o", req.params);

  const decodedReq = endpoints.decodeRequest(v3.Endpoints.Creator.GetCreatorStats, req);
  const channelId = decodedReq.result.params.channelId;
  const creator = await structured.getChannel(channelId);
  let authorStruct = await structured.getMetadata({ authorName: creator.username }, {amount, skip});
  authorStruct = _.merge(authorStruct, {
    authorSource: creator.channelId,
    authorName: creator.username,
  })
  const { units, ready } = structured.buildRecommFlat(authorStruct);

  debug("Returning byAuthor (%o) %d video considered, %d recommendations",
    creator, _.size(authorStruct.content), _.size(ready) );

  const retval = endpoints.decodeResponse(v3.Endpoints.Creator.GetCreatorStats, {
    authorName: authorStruct.authorName,
    authorSource: authorStruct.authorSource,
    paging: authorStruct.paging,
    overflow: authorStruct.overflow,
    ...units,
    content: ready,
  });

  if(retval.type === 'error') {
    debug("Invalid generated byAuthor stats! %O", retval);
    return { json: retval }
  }
  return { json: retval.result };
}

module.exports = {
  byVideoId,
  byProfile,
  ogpProxy,
  videoByCreator,
  repullByCreator,
  getRecommendationById,
  updateVideoRec,
  creatorRegister,
  creatorVerify,
  creatorGet,
  creatorDelete,
  getCreatorStats,
};
