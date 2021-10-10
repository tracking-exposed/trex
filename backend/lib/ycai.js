/* youchoose.ai specific library support */
const _ = require('lodash');
const nconf = require('nconf');
const debug = require('debug')('lib:ycai');

const utils = require('../lib/utils');
const mongo3 = require('./mongo3');

async function fetchRecommendations(videoId, kind) {
    // kind might be 'demo', 'producer', 'community'
    let filter = {};
    if(kind === 'producer') {
        filter.videoId = videoId;
    } else if(kind === 'community') {
        debug("Not yet supported community recommendations");
        return [];
    }

    const RECOMMENDATION_MAX = 20;
    const mongoc = await mongo3.clientConnect({concurrency: 1});
    const videoInfo = await mongo3
        .readOne(mongoc, nconf.get('schema').ytvids, filter);

    let result = [];
    if(videoInfo &&
        videoInfo.recommendations &&
        videoInfo.recommendations.length) {

        result = await mongo3
            .readLimit(mongoc, nconf.get('schema').recommendations, {
                urlId: { "$in": videoInfo.recommendations }
            }, {}, RECOMMENDATION_MAX, 0)

        if(RECOMMENDATION_MAX == result.length)
            debug("More recommendations than what is possible!")

        result = _.map(result, function(e) {
            _.unset(e, '_id');
            return e;
        })
        result = _.sortBy(result, [(r) => videoInfo.recommendations.indexOf(r.urlId)])
    }
    await mongoc.close();
    return result;
}

async function fetchRecommendationsByProfile(profileInfo) {
    // cryptography and authentication not yet implemented
    const INTERFACE_MAX = 100;
    const mongoc = await mongo3.clientConnect({concurrency: 1});
    const results = await mongo3
        .readLimit(mongoc, nconf.get('schema').recommendations, {
        }, {}, INTERFACE_MAX, 0);
    if(INTERFACE_MAX == results.length) {
        debug("More recommendations than what is possible!")
    }
    await mongoc.close();
    return results;
}

async function saveRecommendationOGP(ogblob) {
    // this opengraph might have redundant fields so we pick only what's matter
    const fields = ['title', 'description', 'url', 'image']
    const keep = _.pick(ogblob, fields);
    // TODO here we should associate a 'type' by the kind of domain name

    // ensure the presence of the required field (except image+desc)
    const error = [];
    _.each(['title', 'url'], function(fname) {
        if(!keep[fname] || !keep[fname].length) {
            error.push(fname);
        }
    });
    if(error.length)
        return error;

    keep.when = new Date();
    keep.urlId = utils.hash({url: keep.url})
    const mongoc = await mongo3.clientConnect({concurrency: 1});
    const res = await mongo3
        .writeOne(mongoc, nconf.get('schema').recommendations, keep);
    await mongoc.close();

    if(!res.result || !res.result.ok) {
        debug("Mongo error? %j", res);
        return ["MongoDB error!"];
    }
    return keep;
}

async function getRecommendationByURL(url) {
    const urlId = utils.hash({url});
    const mongoc = await mongo3.clientConnect({concurrency: 1});
    const res = await mongo3
        .readOne(mongoc, nconf.get('schema').recommendations, {urlId});
    await mongoc.close();
    return res;
}

async function getVideoFromYTprofiles(creator, limit) {
    // TODO in the future the creator would be a post auth object
    const mongoc = await mongo3.clientConnect({concurrency: 1});
    const res = await mongo3
        .readLimit(mongoc, nconf.get('schema').ytvids, {
            creatorId: creator.id
        }, {}, limit, 0);
    await mongoc.close();
    return res;
}

async function recommendationById(ids) {
    const mongoc = await mongo3.clientConnect({concurrency: 1});
    const res = await mongo3
        .readLimit(mongoc, nconf.get('schema').recommendations, {
            "urlId": { "$in": ids }
        }, {}, limit, 0);
    await mongoc.close();
    return res;
}

async function updateRecommendations(videoId, recommendations) {
    const mongoc = await mongo3.clientConnect({concurrency: 1});
    const one = await mongo3
        .readOne(mongoc, nconf.get('schema').ytvids, {
            videoId });
    one.recommendations = recommendations;
    one.when = new Date();
    const check = await mongo3
        .updateOne(mongoc, nconf.get('schema').ytvids, {
            videoId
        }, one);
    await mongoc.close();
    _.unset(one, '_id');
    debug("returning the updated videoId with new reccs %j", one);
    return one;
}

async function generateToken(seed, expireISOdate) {
    const token = utils.hash({token: seed});
    const mongoc = await mongo3.clientConnect({concurrency: 1});
    debug("This is the token %s for %j", token, seed);
    const r = await mongo3.writeOne(mongoc,
        nconf.get('schema').tokens, {
            ...seed,
            token,
            exporeAt: new Date(expireISOdate) });
    await mongoc.close();
    return token;
}

async function getToken(filter) {
// TODO a channelId should be a unique key in the collection
    const mongoc = await mongo3.clientConnect({concurrency: 1});
    debug("This is the token %s for %j", token, seed);
    if(!filter.type) throw new Error("Filter need to contain .type");
    const r = await mongo3.readOne(mongoc, nconf.get('schema').tokens, filter);
    debug("getToken with %j: %s", filter, (r && r.type) ? r.token : "Not Found");
    await mongoc.close();
    return r;
}

async function registerVideos(videol, channelId) {
    const objl = _.map(videol, function(vi) {
        return {
            ...vi,
            creatorId: channelId,
            when: new Date(),
        };
    });
    debug("Adding %d videos to recorded YCAI available videos", objl.length);
    const mongoc = await mongo3.clientConnect({concurrency: 1});
    for (ytv of objl) {
        try {
            await mongo3
                .writeOne(mongoc, nconf.get('schema').ytvids, ytv);
        } catch(error) {
            debug("Error in writeOne ytvids of %s: %s", JSON.stringify(ytv), error.message);
        }
    }
    await mongoc.close();
    // no return value here
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
};
