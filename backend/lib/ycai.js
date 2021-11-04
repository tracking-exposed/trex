/* youchoose.ai specific library support */
const _ = require("lodash");
const nconf = require("nconf");
const debug = require("debug")("lib:ycai");

const utils = require("../lib/utils");
const mongo3 = require("./mongo3");

async function fetchRecommendations(videoId, kind) {
  // kind might be 'demo', 'producer', 'community'
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

    result = _.map(result, function (e) {
      _.unset(e, "_id");
      if (e.description === null) {
        delete e.description;
      }
      return e;
    });
    result = _.sortBy(result, [
      (r) => videoInfo.recommendations.indexOf(r.urlId),
    ]);
  }
  await mongoc.close();
  return result;
}

async function fetchRecommendationsByProfile(token) {
  // cryptography and authentication not yet implemented
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
  console.log('fetchRecommendationsByProfile', creator);
  if (INTERFACE_MAX == results.length) {
    debug("More recommendations than what is possible! (we should support pagination)");
  }
  await mongoc.close();
  return results;
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

async function saveRecommendationOGP(ogblob, creator) {
  // this opengraph might have redundant fields so we pick only what's matter
  const fields = ["title", "description", "url", "image"];
  const keep = _.pick(ogblob, fields);
  keep.channelId = creator.channelId;

  const domain = (new URL(ogblob.url)).host;
  const domaintype = attributeFromDomain(domain);
  if(domaintype)
    debug("from domain %s type attributed %s", domain, domaintype);
  keep.domaintype = domaintype;

  // ensure the presence of the required field (except image+desc)
  const error = [];
  _.each(["title", "url"], function (fname) {
    if (!keep[fname] || !keep[fname].length) {
      error.push(fname);
    }
  });
  /* read routes/youchoose.ogpProxy to fully understand
   * the return value inconsistencies here */
  if (error.length) return error;

  keep.when = new Date();
  keep.urlId = utils.hash({ url: keep.url });
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
  const urlId = utils.hash({ url });
  const mongoc = await mongo3.clientConnect({ concurrency: 1 });
  const res = await mongo3.readOne(
    mongoc,
    nconf.get("schema").recommendations,
    { urlId, channelId: creator.channelId },
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
  debug("returning the updated videoId with new reccs %j", one);
  return one;
}

async function generateToken(seed, expireISOdate) {
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
