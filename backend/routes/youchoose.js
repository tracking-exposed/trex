const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('routes:youchoose');
const fetchOpengraph = require('fetch-opengraph');

const ycai = require('../lib/ycai');
const curly = require('../lib/curly');
const endpoints = require('../lib/endpoint');
const { v3 } = require('@shared/endpoints');
const structured = require('../lib/structured');

const PUBLIC_AMOUNT_ELEMS = 100;

async function verifyAuthorization(req, model) {
  /* this function is called any time a route below
   * need to ensure the creator is valid. returns creator object */

  const decodedReq = endpoints.decodeRequest(model, req);
  if (decodedReq.type === 'error') {
    debug('Failed input validation [%o] [%o]', decodedReq.result, {
      params: req.params,
      body: req.body,
      headers: req.headers,
    });
    return {
      creator: {
        error: true,
        details: decodedReq.result,
      },
    };
  }
  const verificationToken = decodedReq.result.headers['x-authorization'];

  debug('verifiyAuthorization by token %s', verificationToken);
  const check = await ycai.getCreatorByToken(verificationToken);

  if (check.error) {
    /* the 'check' contains an error and would be returned by handler */
    debug('Invalid token: %s, authorization fail', check);
  }
  /* else, the 'check' contains the creator object for the route */
  return { creator: check, decodedReq };
}

async function byVideoId(req) {
  /* this function is invoked as GET when creators edit a video */
  const videoId = req.params ? _.get(req.params, 'videoId') : null;
  const channelId = req.query ? _.get(req.query, 'channelId') : null;

  if (!videoId) {
    debug('Missing mandatory parameter: videoId (%s)', JSON.stringify(req));
    return { json: { error: true, message: 'missing videoId' } };
  }
  debug('Looking recommendations for videoId %s', videoId);
  const avail = await ycai.fetchRecommendations(videoId, 'producer');

  const channelRecommendations = channelId
    ? await ycai.fetchChannelRecommendations(channelId)
    : [];

  return {
    json: avail.concat(
      channelRecommendations
        .filter(({ urlId }) => !avail.find(({ urlId: id }) => id === urlId))
        .map((rec) => ({
          ...rec,
          fromChannel: true,
        }))
    ),
  };
}

async function byProfile(req) {
  // TODO verify this API, why is using the token
  // to query the DB?
  const decodedReq = endpoints.decodeRequest(v3.Creator.CreatorVideos, req);
  if (decodedReq.type === 'error') {
    return {
      json: {
        error: true,
        details: decodedReq.result,
      },
    };
  }
  const token = decodedReq.result.headers['x-authorization'];
  const recommendations = await ycai.fetchRecommendationsByProfile(token);

  debug(
    'creator is fetching their %d recommendations (cleaned %d)',
    recommendations.length,
    recommendations.length
  );
  const valid = endpoints.decodeResponse(
    v3.Creator.CreatorRecommendations,
    recommendations
  );

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

async function patchRecommendation(req) {
  const { creator, decodedReq } = await verifyAuthorization(
    req,
    v3.Creator.PatchRecommendation
  );

  if (creator.error) {
    return { json: creator };
  }

  const { urlId } = req.params;
  const patch = decodedReq.result.body;

  const result = await ycai.patchRecommendation(creator, urlId, patch);

  if (result.error) {
    debug('Error patching recommendation %O', result);
    return {
      json: {
        error: true,
        message: result.message,
      },
    };
  }
  // TODO: validate response

  return { json: result };
}

async function ogpProxy(req) {
  const { creator, decodedReq } = await verifyAuthorization(
    req,
    v3.Creator.CreateRecommendation
  );
  if (creator.error) return { json: creator };

  const url = decodedReq.result.body.url;
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
  } catch (error) {
    debug('Error with open graph protocol (%s): %s', url, error.message);
    return {
      json: {
        error: true,
        message: error.message,
      },
    };
  }
  const review = await ycai.saveRecommendationOGP(ogresult, creator);
  if (review.error) {
    debug('We got an error in OGP (%s) %s', url, review.message);
    return { json: review };
  }
  debug('Fetched and saved correctly %s', url);
  return { json: review };
}

const cleanVideoForAPIOutput = (video) => {
  delete video._id;
  if (!video.recommendations) {
    video.recommendations = [];
  }
  return video;
};

async function videoByCreator(req) {
  const { creator } = await verifyAuthorization(req, v3.Creator.CreatorVideos);
  if (creator.error) return { json: creator };

  debug('Querying DB.ytvids for profile [%s]', creator.username);
  const MAXVIDOEL = 100;
  const videos = await ycai.getVideoFromYTprofiles(creator, MAXVIDOEL);

  const ready = _.map(videos, cleanVideoForAPIOutput);

  debug(
    'Requested Video List by content creator (%s) returning %d',
    creator.username,
    ready.length
  );

  const valid = endpoints.decodeResponse(v3.Creator.CreatorVideos, ready);

  if (valid.type === 'error') {
    debug('Invalid generated output for videoByCreator %O', valid);
    return {
      json: {
        details: valid.result,
      },
    };
  }
  return { json: valid.result };
}

async function oneVideoByCreator(req) {
  const { creator, decodedReq } = await verifyAuthorization(
    req,
    v3.Creator.OneCreatorVideo
  );
  if (creator.error) return { json: creator };

  const videoId = decodedReq.result.params.videoId;

  debug(
    'Querying DB.ytvids to get video with id [%s] for profile [%s]',
    videoId,
    creator.username
  );

  const video = await ycai.getOneVideoFromYTprofile(creator, videoId);

  if (video === undefined) {
    const message = `Video with id [${videoId}] not found`;

    debug(message);
    return {
      json: {
        error: true,
        details: [message],
      },
    };
  }

  debug('Found video with id [%s]', videoId);

  return { json: cleanVideoForAPIOutput(video) };
}

async function repullByCreator(req) {
  const { creator } = await verifyAuthorization(
    req,
    v3.Creator.PullCreatorVideos
  );
  if (creator.error) return { json: creator };

  const titlesandId = await curly.recentVideoFetch(creator.channelId);
  debug('Repull caused retrival of %d new videos', titlesandId.length);
  await ycai.registerVideos(titlesandId, creator.channelId);
  return { json: titlesandId };
}

async function getRecommendationById(req) {
  // this is a public function, anyone can query a recommandation detail
  // this function support a single Id or a list of IDs
  const paramsResult = endpoints.decodeRequest(
    v3.Public.GetRecommendations,
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
  const { creator } = await verifyAuthorization(req, v3.Creator.UpdateVideo);
  if (creator.error) return { json: creator };

  const update = req.body;
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
  if (updated.error)
    debug('Error in updateRecommendations: %s', updated.message);

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

  const consistency = await curly.verifyChannel(channelId);
  if (consistency !== true) {
    debug('Impossible validate the channel: %s', consistency.message);
    return {
      json: consistency,
    };
  }

  const expireAt = moment().add(1, 'week').toISOString();
  const verificationToken = await ycai.generateToken(channelId, expireAt);

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

  if (!tokeno || !tokeno.verificationToken) {
    return {
      json: {
        error: true,
        message: 'token not found',
      },
    };
  }
  debug('Fetching youtube.com while looking for the token string!');
  const pageData = await curly.tokenFetch(channelId);
  debug('Code retrieved %s', pageData.code);

  if (tokeno.verificationToken !== pageData.code) {
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
    debug('Error in confirmCreator: %s', error.message);
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

  const { creator } = await verifyAuthorization(req, v3.Creator.GetCreator);
  if (creator.error) return { json: creator };

  const validatedc = endpoints.decodeResponse(v3.Creator.GetCreator, {
    ...creator,
    registeredOn: creator.registeredOn.toISOString(),
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
  // delete every data on their belong,
  const { creator } = await verifyAuthorization(req, v3.Creator.GetCreator);
  if (creator.error) return { json: creator };

  const result = await ycai.deleteMaterial(creator, [
    'recommendations',
    'creators',
    'tokens',
    'ytvids',
  ]);

  return { json: result };
}

async function getCreatorStats(req) {
  const amount = PUBLIC_AMOUNT_ELEMS;
  const skip = 0;

  const decodedReq = endpoints.decodeRequest(v3.Creator.GetCreatorStats, req);
  const channelId = decodedReq.result.params.channelId;
  const creator = await structured.getChannel(channelId);
  if (!creator) {
    debug('Creator not found by channelId %s', channelId);
    return { json: { error: true, message: 'Creator not found' } };
  }

  let authorStruct = null;
  try {
    authorStruct = await structured.getMetadata(
      { authorName: creator.username },
      { amount, skip }
    );
  } catch (error) {
    debug('Error in structured.getMetadata: %s %s', error.message, error.stack);
  }

  if (!authorStruct)
    return { json: { error: true, message: 'Unable to fetch CreatorStats' } };

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

  const retval = endpoints.decodeResponse(v3.Creator.GetCreatorStats, {
    authorName: authorStruct.authorName,
    authorSource: authorStruct.authorSource,
    paging: authorStruct.paging,
    overflow: authorStruct.overflow,
    ...units,
    content: ready,
  });

  if (retval.type === 'error') {
    debug('Invalid generated byAuthor stats! %O', retval);
    return { json: retval };
  }
  return { json: retval.result };
}

module.exports = {
  byVideoId,
  byProfile,
  patchRecommendation,
  ogpProxy,
  videoByCreator,
  oneVideoByCreator,
  repullByCreator,
  getRecommendationById,
  updateVideoRec,
  creatorRegister,
  creatorVerify,
  creatorGet,
  creatorDelete,
  getCreatorStats,
};
