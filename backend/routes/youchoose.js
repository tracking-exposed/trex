const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('routes:youchoose');
const fetchOpengraph = require('fetch-opengraph');

const ycai = require('../lib/ycai');
const curly = require('../lib/curly');
const endpoints = require('../lib/endpoint');
const { v3 } = require('../endpoints');
const structured = require('../lib/structured');

const PUBLIC_AMOUNT_ELEMS = 100;

async function byVideoId(req) {
  /* this function is invoked as GET when creators edit a video */
  const videoId = req.params ? _.get(req.params, 'videoId') : null;
  if (!videoId) {
    debug('Missing mandatory parameter: videoId (%s)', JSON.stringify(req));
    return { json: { error: true, message: 'missing videoId' } };
  }
  debug('Looking recommendations for videoId %s', videoId);
  const avail = await ycai.fetchRecommendations(videoId, 'producer');
  return { json: avail };
}

async function byProfile(req) {
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
  const recommendations = await ycai.fetchRecommendationsByProfile(token);

  debug(
    'creator is fetching their %d recommendations (cleaned %d)',
    recommendations.length, recommendations.length
  );
  const valid = endpoints.decodeResponse(
    v3.Endpoints.Creator.CreatorRecommendations, recommendations);

  if (valid.type === 'error') {
    debug('Invalid generated output for creator Recommendations %O', valid);
    return {
      json: {
        details: valid.result,
      },
    };
  }
  return { json: valid.result };
}

async function ogpProxy(req) {
  const decodedReq = endpoints.decodeRequest(v3.Endpoints.Creator.CreateRecommendation, req);
  const token = decodedReq.result.headers['x-authorization'];
  const url = decodedReq.result.body.url;

  const creator = await ycai.getCreatorByToken(token);
  if (!creator) {
    return {
      json: {
        error: true,
        message: "Creator doesn't exists",
      },
    };
  }
  const exists = await ycai.getRecommendationByURL(url, creator);
  if (exists) {
    debug('Requested OGP to an already acquired URL %s', url);
    return {
      json: exists,
    };
  }
  let ogresult = null;
  try {
    ogresult = await fetchOpengraph.fetch(url);
  } catch(error) {
    debug("Error with open graph protocol (%s): %s",
      url, error.message);
    return {
      json: {
        error: true,
        message: error.message
      }
    }
  }
  const review = await ycai.saveRecommendationOGP(ogresult, creator);
  if (review.error) {
    debug('We got an error in OGP (%s) %s', url, review.message);
    return { json: review };
  }
  debug('Fetched and saved correctly %s', url);
  return { json: review };
}

async function videoByCreator(req) {
  // this function should validate req.params.authMaterial
  const decodedReq = endpoints.decodeRequest(
    v3.Endpoints.Creator.CreatorVideos,
    req
  );
  if (decodedReq.type === 'error') {
    return {
      json: {
        error: true,
        details: decodedReq.result,
      },
    };
  }
  const token = decodedReq.result.headers['x-authorization'];
  const creator = await ycai.getCreatorByToken(token);

  debug('Querying DB.ytvids for profile [%s]', creator._id);
  const MAXVIDOEL = 100;
  const videos = await ycai.getVideoFromYTprofiles(
    creator,
    MAXVIDOEL
  );

  // format: recommendation might be empty or unset
  // creatorId, when, videoId, title, recommendations: []
  const ready = _.map(videos, function (v) {
    _.unset(v, '_id');
    if (!v.recommendations) v.recommendations = [];
    return v;
  });

  debug(
    'Requested Video List by content creator (%s) returning %d',
    creator.username,
    ready.length
  );

  return { json: ready };
}

async function repullByCreator(req) {
  const decodedReq = endpoints.decodeRequest(
    v3.Endpoints.Creator.PullCreatorVideos,
    req
  );
  if (decodedReq.type === 'error') {
    return {
      json: {
        error: true,
        details: decodedReq.result,
      },
    };
  }
  const token = decodedReq.result.headers['x-authorization'];
  // debug('repullByCreator token %s', token);
  const creator = await ycai.getCreatorByToken(token);
  //debug('repullByCreator %j', creator);
  const titlesandId = await curly.recentVideoFetch(creator.channelId);
  debug('Repull caused retrival of %d new videos',
    titlesandId.length);
  await ycai
    .registerVideos(titlesandId, creator.channelId);
  return { json: titlesandId };
}

async function getRecommendationById(req) {
  // this is a public function, anyone can query a recommandation detail
  // this function support a single Id or a list of IDs
  const paramsResult = endpoints.decodeRequest(
    v3.Endpoints.Public.GetRecommendations,
    req
  );
  debug('params result %O', paramsResult);
  if (paramsResult.type === 'error') {
    return {
      json: paramsResult,
    };
  }
  const ids = paramsResult.result.params.ids.split(',');

  const limit = paramsResult.result.query.limit;
  const recomms = await ycai.recommendationById(ids, limit);
  debug('getRecommendationById (%d ids) found %d', ids.length, recomms.length);
  return { json: recomms };
}

async function updateVideoRec(req) {
  const update = req.body;
  const decodedReq = endpoints.decodeRequest(
    v3.Endpoints.Creator.UpdateVideo,
    req
  );
  if (decodedReq.type === 'error') {
    return {
      json: {
        error: true,
        details: decodedReq.result
      },
    };
  }

  const creator = await ycai.getCreatorByToken(
    decodedReq.result.headers['x-authorization']
  );

  if (!creator) {
    return {
      json: {
        error: true,
        message: "Creator doesn't exists",
      },
    };
  }
  if (!update.videoId)
    return { json: { error: true, message: 'missing videoId' } };

  if (!update.recommendations || !update.recommendations.length)
    update.recommendations = [];

  if (
    _.find(update.recommendations, function (e) {
      return !(_.isString(e) && e.length === 40);
    })
  )
    return {
      json: { error: true, message: 'validation fail in recommendation list' },
    };

  debug(
    'Updating videoId %s with %d recommendations',
    update.videoId,
    update.recommendations.length
  );

  const updated = await ycai.updateRecommendations(
    update.videoId,
    update.recommendations
  );
  if(updated.error)
    debug("Error in updateRecommendations: %s", updated.message);

  return { json: updated };
}

async function creatorRegister(req) {
  const channelId = _.get(req.params, 'channelId');
  if (!channelId || channelId.length < 10)
    return {
      json: {
        error: true,
        message: 'channelId missing?!',
      },
    };

  const type = _.get(req.body, 'type');
  if (type !== 'channel')
    return {
      json: {
        error: true,
        message: 'Not supported type?',
      },
    };

  const expireAt = moment().add(1, 'week').toISOString();
  /* channel and type is the seed, by adding a random
   * input we ensure monouse and unpredictable tokens */
  const verificationToken = await ycai.generateToken(
    { channelId, type, predictplease: _.random(0, 0xffff) },
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

  const tokeno = await ycai.getToken({
    type: 'channel',
    channelId,
  });

  if(!tokeno || !tokeno.verificationToken) {
    return {
      json: {
        error: true,
        message: "token not found",
      }
    }
  }
  debug("Fetching youtube.com while looking for the token string!");
  const pageData = await curly.tokenFetch(channelId);
  debug("Code retrieved %s", pageData.code);

  if (tokeno.verificationToken != pageData.code) {
    debug('Validation fail: %s != %s', tokeno.verificationToken, pageData.code);
    return {
      json: {
        error: true,
        message: 'code not found!',
      },
    };
  }

  debug(
    'Validated token, invoking creation with token %o page info %o',
    tokeno,
    pageData
  );
  try {
    // two action happens in this function:
    // 1) remove the token
    // 2) create a 'creator' entry with the new auth material
    const creator = await ycai.confirmCreator(tokeno, pageData);
    return {
      json: creator,
    };
  } catch (error) {
    return {
      json: {
        error: true,
        message: error.message,
      },
    };
  }
}

async function creatorGet(req) {
  // this is the /v3/creator/me query, it looks into
  // 'creators' mongodb collection.

  const decodedReq = endpoints.decodeRequest(
    v3.Endpoints.Creator.GetCreator,
    req
  );
  if (decodedReq.type === 'error') {
    return {
      json: {
        error: true,
        details: decodedReq.result,
      },
    };
  }
  const verificationToken = decodedReq.result.headers['x-authorization'];
  // const channelId = req.headers.channelId;
  // if(!channelId && !verificationToken)
  //   return { json: { error: true, message: "missing channelId or verificationToken in the header"}};

  debug('getCreator by token %s', verificationToken);
  const infoavail = await ycai.getCreatorByToken(verificationToken);
  if(infoavail.error) {
    debug('Invalid token: %s', infoavail);
    return { json: infoavail };
  }

  const validatedc = endpoints.decodeResponse(v3.Endpoints.Creator.GetCreator, {
    ...infoavail,
    registeredOn: infoavail.registeredOn.toISOString(),
  });

  if (validatedc.type === 'error') {
    debug('Invalid generated output for creatorGet %O', validatedc);
    return {
      json: {
        details: validatedc.result,
      },
    };
  }
  return { json: validatedc.result };
}

async function creatorDelete(req) {
  // this function is invoked when a content creator wants to
  // delete every data on their belong
  console.log('TODO: Not implemented nor yet specify');
  throw new Error("NYI");
}

async function getCreatorStats(req) {
  const amount = PUBLIC_AMOUNT_ELEMS;
  const skip = 0;

  const decodedReq = endpoints.decodeRequest(
    v3.Endpoints.Creator.GetCreatorStats,
    req
  );
  const channelId = decodedReq.result.params.channelId;
  const creator = await structured.getChannel(channelId);
  if(!creator) {
    debug("Creator not found by channelId %s", channelId);
    return { json: { error: true,
      message: "Creator not found" }
    }
  }

  let authorStruct = null;
  try {
    authorStruct = await structured.getMetadata(
      { authorName: creator.username },
      { amount, skip }
    );
  } catch(error) {
    debug("Error in structured.getMetadata: %s %s",
      error.message, error.stack);
  }

  if(!authorStruct)
    return { json: { error: true,
      message: "Unable to fetch CreatorStats"}
    };

  authorStruct = _.merge(authorStruct, {
    authorSource: creator.channelId,
    authorName: creator.username,
  });
  const { units, ready } = structured.buildRecommFlat(authorStruct);

  debug(
    'Returning byAuthor (%o) %d video considered, %d recommendations',
    creator,
    _.size(authorStruct.content),
    _.size(ready)
  );

  const retval = endpoints.decodeResponse(
    v3.Endpoints.Creator.GetCreatorStats,
    {
      authorName: authorStruct.authorName,
      authorSource: authorStruct.authorSource,
      paging: authorStruct.paging,
      overflow: authorStruct.overflow,
      ...units,
      content: ready,
    }
  );

  if (retval.type === 'error') {
    debug('Invalid generated byAuthor stats! %O', retval);
    return { json: retval };
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
