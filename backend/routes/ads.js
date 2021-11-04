const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('routes:ads');
const nconf = require('nconf');

const params = require('../lib/params');
const utils = require('../lib/utils');
const CSV = require('../lib/CSV');
const mongo3 = require('../lib/mongo3');


async function dbQuery(filter, amount, skip) {
    const mongoc = await mongo3.clientConnect({concurrency: 1});
    const r = await mongo3.readLimit(mongoc,
        nconf.get('schema').ads,
        filter, { savingTime: -1}, amount, skip);
    await mongoc.close();
    return r;
}

async function perVideo(req) {
    const videoId = params.getVideoId(req, 'videoId');
    const entries = await dbQuery({videoId}, 200, 0);
    const grouped = _.groupBy(entries, 'metadataId');
    const ready = _.map(grouped, function(adlist, metadataId) {
        const rv = _.first(adlist);
        rv.snapshots = _.size(adlist);
        rv.userPseudo = _.toUpper(rv.publicKey.replace(/[0-9]/g, '')).substr(7);
        return _.omit(rv, ['publicKey', '_id', 'href'] );
    });
    debug("adsPerVideo %s produced %d ads, grouped %d",
        videoId, _.size(entries), _.size(grouped));
    return { json: ready };
}

async function perChannel(req) {
    const channelId = params.getVideoId(req, 'channelId');
    const mongoc = await mongo3.clientConnect({concurrency: 1});

    const chanmat = await mongo3.readLimit(mongoc,
        nconf.get('schema').ads, { channelId }, {}, 400, 0);

    debug("look ads by Channel (%s) found %d matches",
        channelId, chanmat.length);

    const metadatas = _.uniq(_.map(chanmat, 'metadataId'));
    const ads = await mongo3.readLimit(mongoc,
        nconf.get('schema').ads, { metadataId: { "$in": metadatas }}, {}, 400, 0);
    debug("Total amount of ads sampled %d", ads.length);
    await mongoc.close();
    return { text: "<html><body><pre>" + JSON.stringify(ads, null, 2) };
}

module.exports = {
    perVideo,
    perChannel,
};
