/* structured.js comes from automo, "automongo".

 * It produces structured data, in the sense that a collection of object is nested after:
 * paging info, maximum objects available, info on when have been executed, etc.
 *
 * (probably a standard format to handle this exist;i'm not aware of, that's why this lib)
 */
const _ = require('lodash');
const nconf = require('nconf');
const debug = require('debug')('lib:structured');

const mongo3 = require('./mongo3');

let mongoc = null;
async function getMongoc() {
    if(!mongoc)
        mongoc = await mongo3.clientConnect({concurrency: 7});
    return mongoc;
}

async function getVideo(filter) {
    const mongoc = await getMongoc();

    const sourceVideo = await mongo3.readOne(mongoc,
        nconf.get('schema').metadata, filter);

    if(!sourceVideo || !sourceVideo.id)
        throw new Error("Video not found, invalid videoId");

    return sourceVideo;
}

async function getMetadata(filter, options) {
    const mongoc = await getMongoc();
    const videos = await mongo3.readLimit(mongoc,
        nconf.get('schema').metadata, filter, 
        { savingTime: -1 }, options.amount, options.skip);

    const total = await mongo3.count(mongoc,
        nconf.get('schema').metadata, filter);

    return {
        content: videos,
        overflow: (_.size(videos) === options.amount),
        total,
        pagination: options,
    }
};

async function getChannel(channelId) {
    const mongoc = await getMongoc();
    const filter = { channelId };
    const creator = await mongo3.readOne(mongoc,
        nconf.get('schema').creators, filter);
    return creator;
}

function buildRecommFlat(authorStruct) {
    const units = { total: 0, stripped: 0 }
    const ready = _.flatten(_.compact(_.map(authorStruct.content, function(video, i) {
        if(video.related && video.related[0] && video.related[0].title) {
            units.stripped++;
            return null;
        }
        // ^^^ this because old data with .title haven't the recommendedSource
        // and client can't do anything. so we'll count the effective values
        units.total++;
        video.id = video.id.substr(0, 20);

        return _.map(video.related, function(recommended, n) {
            const cleanVideoId = recommended.videoId.replace(/\&.*/, '');
            return {
                id: video.id + i + cleanVideoId + n,
                watchedTitle: video.title,
                watchedVideoId: video.videoId,
                savingTime: video.savingTime.toISOString(),
                recommendedVideoId: cleanVideoId,
                recommendedViews: recommended.recommendedViews,
                recommendedTitle: recommended.recommendedTitle,
                recommendedChannel: recommended.recommendedSource,
            }
        });
    })));
    return { units, ready };
}

module.exports = {
    getVideo,
    getMetadata,
    getChannel,
    buildRecommFlat,
};
