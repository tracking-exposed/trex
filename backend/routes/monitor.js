const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('routes:personal');

const automo = require('../lib/automo');
const params = require('../lib/params');

async function getMonitor(req) {

    const timeBehind = params.getDate(req, 'isodate', moment().subtract(5, 'minutes').toISOString());
    // 5 minutes is the default, used at the first access

    const amount = 200;
    debug("getMonitor request asking for contents since %s (max %d)", timeBehind, amount);

    const lastExecution = new Date();
    const content = await automo.getMixedDataSince([
        [ 'supporters',
            [ 'publicKey', 'p', 'creationTime', 'version'],
            'creationTime' ],
        [ 'htmls',
            [ 'id', 'metadataId', 'savingTime', 'processed', 'selector', 'href', 'size', 'publicKey'],
            'savingTime' ],
        [ 'metadata',
            [ 'id', 'title', 'videoId', 'watcher', 'authorName', 'authorSource', 'viewInfo'],
            'savingTime' ]
    ], timeBehind, amount );

    debug("getMixedDataSince from DB: %j", _.countBy(content, 'template'));
    // the key template='info' is added if any special condition is triggered
    // the key 'template' and 'relative' are always added

    return {
        json: { content, lastExecution }
    };
};

module.exports = {
    getMonitor,
};