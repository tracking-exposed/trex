const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('routes:monitor');

const automo = require('../lib/automo');
const security = require('../lib/security');
const nconf = require('nconf');

async function getMonitor(req) {

    if(!security.checkPassword(req))
        return { status: 403 };

    const MINUTES = 5;
    const timeBehind = moment().subtract(MINUTES, 'minutes').toISOString();
    const amount = 60;

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

async function deleter(req) {
    if(!security.checkPassword(req)) {
        return { json: {
            error: true, message: "Invalid password"
        }};
    }

    const collection = req.params.c;
    if(-1 === _.keys(nconf.get('schema')).indexOf(collection)) {
        debug("Invalid collection requested!")
        return { json: {
            error: true, message: "Invalid collection"
        }};
    }
    const id = req.params.id;
    if(id.length < 20) {
        debug("Invalid ID requested: %s", id);
        return { json: {
            error: true, message: "Invalid ID format"
        }};
    }
    const keyname = req.params.k;
    if(!(keyname == 'id' || _.endsWith(keyname, 'Id'))) {
        debug("Invalid key field name: %s", keyname);
    }

    const filter = _.set({}, keyname, id);
    debug("Deleter function requested sucessfully: %s %j (executing)",
        collection, filter);
    const deleted = await automo.flexibleRemove(collection, filter);
    const message =`Query executed, object ${deleted ? "deleted" : "NOT deleted"}`;

    return { json: {
        error: false, message
    }};
}

module.exports = {
    getMonitor,
    deleter,
};