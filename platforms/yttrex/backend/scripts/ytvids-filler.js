#!/usr/bin/env node

// this script pick random video combo and fill
// ytvids collection.
// take arbitrary creator.id from ENV

const _ = require('lodash');
const debug = require('debug')('ytvids-filler');
const nconf = require('nconf');

const mongo3 = require('@shared/providers/mongo.provider');

nconf.argv().env().file({ file: 'config/settings.json' });

async function doFiller(creator) {
    const mongoc = await mongo3.clientConnect();

    const random = _.random(0, 13000);
    const metad = await mongo3
        .readLimit(mongoc, nconf.get('schema').metadata, {
        }, {}, 100, random);
    
    const vids = _.flatten(_.compact(_.map(metad, function(meta) {
        if(!meta.related || !meta.related.length)
            return null;

        return _.compact(_.map(meta.related, function(r) {
            if(!r.recommendedTitle || !r.recommendedTitle.length)
                return null;
            return {
                videoId: r.videoId,
                title: r.recommendedTitle
            }
        }));
    })));

    debug("Available %d potential random vids", vids.length);
    const hundred  = _.uniqBy(_.times(125, function(i) {
        const elem = _.sample(vids);
        return {
            ...elem,
            creatorId: creator,
            when: new Date()
        };
    }), 'videoId');

    if(!hundred || !hundred.length) {
        debug("Sadly some problem is preventing us any video");
    } else {
        await mongo3.insertMany(mongoc, nconf.get('schema').ytvids,
            hundred);
    }
    await mongoc.close();
}

try {
    const creator = nconf.get('creator');
    if(!creator) {
        console.log(`This script need --creator`);
        process.exit(1);
    }

    doFiller(creator);
} catch(e) {
    console.log("Error in the main function!", e.message);
}
