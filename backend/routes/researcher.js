const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('routes:researcher');
const nconf = require('nconf');

const csv = require('../lib/CSV');
const utils = require('../lib/utils');
const mongo3 = require('../lib/mongo3');
const security = require('../lib/security');
const wetest  = require('../lib/wetest');

const qustr = require('querystring');

async function researcher(req) {

    if(!security.checkPassword(req))
        return {json: { error: true, message: "Invalid key" }};

    let filter;
    try {
        filter = qustr.unescape(req.params.filter);
        filter = JSON.parse(filter);
    } catch(e) {
        return { json: { error: true, message: e.message, xx: _.keys(e)}};
    }

    if(!_.size(req.params.filter) || !_.size(_.keys(filter)))
        return {json: { error: true, message: "filter missing" }};

    debug(filter)
    return {json: { error: true, message: "Not completely implemented" }};

    const watches = await wetest.pickFromDB(filter, { clientTime: -1 });
    const unroll = _.reduce(watches, csv.unrollRecommended, []);
    // const apivideos = _.uniq(_.flatten(_.map(_.compact(_.map(testVideos, 'apifile')), loadYTAPI)));
    // debug("In total we've %d videos 'related' from API", _.size(apivideos) );
    const ready = _.map(_.map(unroll, wetest.applyWetest1), function(e) {
        // let isAPItoo = apivideos.indexOf(e.recommendedVideoId) !== -1;
        _.set(e, 'top20', (e.recommendationOrder <= 20) );
        // _.set(e, 'isAPItoo', isAPItoo);
        // _.set(e, 'step', _.find(testVideos, { videoId: e.watchedVideoId }).language );
        _.set(e, 'thumbnail', "https://i.ytimg.com/vi/" + e.recommendedVideoId + "/mqdefault.jpg");
        return e;
    });
    // const csvtext = csv.produceCSVv1(ready);

    debug("Returning wetest of %j with %d elements from %d videos", )
    return { json: ready };
    debugger;
};

module.exports = {
    researcher
};
