const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('routes:monitor');

const automo = require('../lib/automo');
const security = require('../lib/security');

async function getMonitor(req) {

    const MINUTES = 5;
    const timeBehind = moment().subtract(MINUTES, 'minutes').toISOString();
    security.checkPassword(req);
    const amount = 30;
    /* debug("getMonitor request: contents since %d minutes ago: %s (max %d)",
        minutesAgo, timeBehind, amount); */

    const lastExecution = new Date();
    const content = await automo.getMixedDataSince([
        [ 'supporters',
            [ 'publicKey', 'p', 'creationTime', 'version'],
            'creationTime' ],
        [ 'htmls',
            [ 'id', 'metadataId', 'savingTime', 'processed', 'selector', 'href', 'size', 'publicKey'],
            'savingTime' ],
        [ 'metadata',
            [ 'id', 'title', 'videoId', 'watcher', 'authorName', 'authorSource', 'viewInfo', 'savingTime'],
            'savingTime' ]
    ], new Date(timeBehind), amount );

    if(content.length)
        debug("getMonitor returns: %j", _.countBy(content, 'template'));
    // the key template='info' is added if any special condition is triggered
    // the key 'template' and 'relative' are always added

    const ordered = _.orderBy(content, [ 'timevar' ], [ 'desc' ]);
    return {
        json: {
            content: ordered,
            start: moment(lastExecution).format('HH:mm:ss'),
            end: moment(new Date()).format('HH:mm:ss'),
            duration: moment.duration(moment() - moment(lastExecution)).asSeconds(),
        }
    };
};

module.exports = {
    getMonitor,
};