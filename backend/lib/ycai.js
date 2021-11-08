/* youchoose.ai specific library support */
const _ = require("lodash");
const nconf = require("nconf");
const debug = require("debug")("lib:ycai");

const utils = require("../lib/utils");
const mongo3 = require("./mongo3");


function ensureRecommendationsDefault(recc) {
  const DEFAULT_IMAGE_URL = "https://youchoose.tracking.exposed/images/creators.png";
  return _.reduce(["urlId", "url", "title", "description", "image"], function(memo, field) {
    /* as documented in #114 (yttrex repo) this function ensure 
     * some default behavior, and uses a _.reduce here because 
     * title should be replaced with URL if for any reason is missing */
    if(field === "urlId" || field === "url")
      memo[field] = recc[field];
    else if(field === "title") {
      if(!recc[field] || !recc[field].length)
        memo[field] = _.toUpper(recc.url.replace(/^https?:\/\//, ''));
      else
        memo[field] = recc[field];
    } else if(field === "description") {
      if(recc[field] && recc[field].length)
        memo[field] = recc[field];
    } else if(field === "image") {
      if(!recc[field] || !recc[field].length)
        memo[field] = DEFAULT_IMAGE_URL;
      else
        memo[field] = recc[field];
    }
    return memo;
  }, {});
}

async function fetchRecommendations(videoId, kind) {
  // kind might be 'demo', 'producer', 'community', but,
  // at the moment only producer is actually implemented and
  // considered in the workflow.
  let filter = {};
  if (kind === "producer") {
    filter.videoId = videoId;
  } else if (kind === "community") {
    debug("Not yet supported community recommendations");
    return [];
  }

  const RECOMMENDATION_MAX = 20;
  const mongoc = await mongo3.clientConnect({ concurrency: 1 });
  const videoInfo = await mongo3.readOne(
    mongoc,
    nconf.get("schema").ytvids,
    filter
  );

  let result = [];
  if (
    videoInfo &&
    videoInfo.recommendations &&
    videoInfo.recommendations.length
  ) {
    result = await mongo3.readLimit(
      mongoc,
      nconf.get("schema").recommendations,
      {
        urlId: { $in: videoInfo.recommendations },
      },
      {},
      RECOMMENDATION_MAX,
      0
    );

    if (RECOMMENDATION_MAX == result.length)
      debug("More recommendations than what is possible!");

    result = _.map(result, ensureRecommendationsDefault);
    result = _.sortBy(result, [
      (r) => videoInfo.recommendations.indexOf(r.urlId),
    ]);
  }
  await mongoc.close();
  return result;
}

async function fetchRecommendationsByProfile(token) {
  const INTERFACE_MAX = 100;
  const mongoc = await mongo3.clientConnect({ concurrency: 1 });
  const creator = await mongo3
    .readOne(mongoc, nconf.get("schema").creators, {accessToken: token});
  const results = await mongo3.readLimit(
    mongoc,
    nconf.get("schema").recommendations,
    { channelId: creator.channelId },
    { when: -1 },
    INTERFACE_MAX,
    0
  );
  if (INTERFACE_MAX == results.length) {
    debug("More recommendations than what is possible! (we should support pagination)");
  }
  await mongoc.close();
  return _.map(results, ensureRecommendationsDefault);
}

function attributeFromDomain(domain) {
  // for youtube, facebook, twitter, wikipedia, and
  // any other website that we want to recognize with
  // their favicon in the interface, we can match it
  const map = {
    'youtube': ['youtube.com', 'youtu.be'],
    'wikipedia': ['wikipedia.com'],
    'twitter': ['twitter.com'],
  }
  const found = _.filter(_.keys(map), function(k) {
    const dlist = map[k];
    return _.some(dlist, function(dtest) {
      return _.endsWith(domain, dtest);
    });
  });
  return found.length ? _.first(found) : null;
}

const OGPfields = ["title", "description", "url", "image"];
async function saveRecommendationOGP(ogblob, creator) {
  /* as per #114 the payload might be saved also if some fields 
   * aren't present, an approrpiate conversion happens in 
   * fetchRecommendation by providing default values */
  const keep = _.reduce(OGPfields, function(memo, field) {
    if(ogblob[field])
      memo[field] = ogblob[field];
    return memo;
  }, {});

  if(!keep.url)
    return { error: true, message: "The only foundamental field is missing (url)"};

  const domain = (new URL(ogblob.url)).host;
  const domaintype = attributeFromDomain(domain);
  if(domaintype) {
    debug("from domain %s type attributed %s", domain, domaintype);
    keep.domaintype = domaintype;
  }

  keep.channelId = creator.channelId;
  keep.when = new Date();
  keep.urlId = utils.hash({ url: keep.url, channelId: creator.channelId });

  const mongoc = await mongo3.clientConnect({ concurrency: 1 });
  const res = await mongo3.writeOne(
    mongoc,
    nconf.get("schema").recommendations,
    keep
  );
  await mongoc.close();

  if (!res.result || !res.result.ok) {
    debug("Mongo error? %j", res.result);
    return ["MongoDB error!"];
  }
  _.unset(keep, '_id');
  return keep;
}

async function getRecommendationByURL(url, creator) {
  const urlId = utils.hash({ url, channelId: creator.channelId });
  const mongoc = await mongo3.clientConnect({ concurrency: 1 });
  const res = await mongo3.readOne(
    mongoc,
    nconf.get("schema").recommendations,
    { urlId },
  );
  await mongoc.close();
  return res;
}

async function getVideoFromYTprofiles(creator, limit) {
  const mongoc = await mongo3.clientConnect({ concurrency: 1 });
  const res = await mongo3.readLimit(
    mongoc,
    nconf.get("schema").ytvids,
    { creatorId: creator.channelId },
    {},
    limit,
    0
  );
  await mongoc.close();
  return res;
}

async function recommendationById(ids, limit) {
  const mongoc = await mongo3.clientConnect({ concurrency: 1 });
  const res = await mongo3.readLimit(
    mongoc,
    nconf.get("schema").recommendations,
    {
      urlId: { $in: ids },
    },
    {},
    limit,
    0
  );
  await mongoc.close();
  return res;
}

async function updateRecommendations(videoId, recommendations) {
  const mongoc = await mongo3.clientConnect({ concurrency: 1 });
  const one = await mongo3.readOne(mongoc, nconf.get("schema").ytvids, {
    videoId,
  });
  if(!one)
    return { error: true, message: "Video not found: are you sure you own it?" };

  one.recommendations = recommendations;
  one.when = new Date();
  const check = await mongo3.updateOne(
    mongoc,
    nconf.get("schema").ytvids,
    {
      videoId,
    },
    one
  );
  await mongoc.close();
  _.unset(one, "_id");
  debug("video Recommendations updated! (now %d)", one.recommendations.length);
  return one;
}

async function generateToken(seed, expireISOdate) {
  /* TODO we need to use a public/private key schema to generate
   * a secure accessToken that can be used also if the verification
   * process gets interrupted */
  const verificationToken = utils.hash({ token: seed });
  const mongoc = await mongo3.clientConnect({ concurrency: 1 });
  const p = await mongo3.readOne(mongoc, nconf.get('schema').tokens, {
    verificationToken
  });

  if(!p) {
    const r = await mongo3.writeOne(mongoc, nconf.get("schema").tokens, {
      ...seed,
      verificationToken,
      verified: false,
      expireAt: new Date(expireISOdate),
    });
    debug("Generated token %s for %j (result %O)",
      verificationToken, seed, r.result);
  } else {
    debug("Token %s not generated (already present, expires on %s)",
      verificationToken, p.expireAt);
  }

  await mongoc.close();
  return verificationToken;
}

async function getToken(filter) {
  const mongoc = await mongo3.clientConnect({ concurrency: 1 });
  if (!filter.type) throw new Error("Filter need to contain .type");
  const r = await mongo3.readOne(mongoc, nconf.get("schema").tokens, filter);
  await mongoc.close();

  const found = (r && r.type)
  if(!found) {
    debug("getToken with %j: Not found", filter);
    return null;
  }
  debug("getToken with %j: %s", filter, r.verificationToken);
  return r;
}

async function confirmCreator(tokeno, creatorInfo) {
  // this function create 'creator' entry and means the
  // user is not VERIFIED. therefore has full access to
  // YCAI recommendation control.
  const mongoc = await mongo3.clientConnect({ concurrency: 1 });

  // assume tokeno.type === 'channel'
  const r = await mongo3.deleteMany(mongoc,
    nconf.get("schema").tokens, { channelId: tokeno.channelId });
  if(r.result.ok != 1)
    debug("Error? not found token to remove for channelId %s", tokeno.channelId);

  _.unset(creatorInfo, 'code');
  // 'code' is how the curly function return the token found.
  const creator = {
    channelId: tokeno.channelId,
    registeredOn: new Date(),
    ...creatorInfo,
    accessToken: "ACTK" + utils.hash({
      random: _.random(0, 0xfffffff),
      channel: tokeno.channelId
    })
  }

  try {
    await mongo3.deleteMany(mongoc,
      nconf.get("schema").creators, { channelId: tokeno.channelId});
    const x = await mongo3.writeOne(mongoc,
      nconf.get("schema").creators, creator);
    if(x.result.ok != 1)
      debug("Error? unable to write creator on the DB %j", x.result);
  } catch(error) {
    debug("Error in confirmCreator: %s", error.message);
    throw new Error(`Error in confirmCreator: ${error.message}`);
  }

  await mongoc.close();
  return creator;
}

async function registerVideos(videol, channelId) {
  const objl = _.map(videol, function (vi) {
    return {
      ...vi,
      creatorId: channelId,
      when: new Date(),
    };
  });
  debug("Adding %d videos to recorded YCAI available videos", objl.length);
  const mongoc = await mongo3.clientConnect({ concurrency: 1 });
  for (ytv of objl) {
    try {
      await mongo3.writeOne(mongoc, nconf.get("schema").ytvids, ytv);
    } catch (error) {
      debug(
        "Error in writeOne ytvids of %s: %s",
        JSON.stringify(ytv),
        error.message
      );
    }
  }
  await mongoc.close();
  // no return value here
}

async function getCreatorByToken(token) {
  // this function might be executed to query the
  // state of a content creator. it might be
  // fully authenticated, or not. the filter
  // works on creators and tokens, considering the
  // token are going to expire automatically.
  const mongoc = await mongo3.clientConnect({ concurrency: 1 });
  const creator = await mongo3
    .readOne(mongoc, nconf.get("schema").creators, {
      accessToken: token
    });
  await mongoc.close();

  if(creator) {
    debug("getCreatorByToken found %s, %s",
      creator.channelId, creator.username);
    return creator;
  } else {
    return {
      error: true,
      message: "Not found"
    }
  }
}

module.exports = {
  fetchRecommendations,
  fetchRecommendationsByProfile,
  saveRecommendationOGP,
  getRecommendationByURL,
  getVideoFromYTprofiles,
  recommendationById,
  updateRecommendations,
  generateToken,
  getToken,
  registerVideos,
  getCreatorByToken,
  confirmCreator,
};
