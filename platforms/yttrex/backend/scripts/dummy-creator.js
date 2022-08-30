#!/usr/bin/env node
const _ = require('lodash');
const debug = require('debug')('dummy-creator');
const moment = require('moment');
const nconf = require('nconf');

const mongo3 = require('@shared/providers/mongo.provider');
const utils = require('../lib/utils');

var cfgFile = "config/settings.json";
nconf.argv().env().file({ file: cfgFile });
const maxVideos = 100;

async function updatePublicProfile() {
    const dummyPublicKey="publicpublicpublicpublicpublic";
    const supporter = {
        publicKey: dummyPublicKey,
        version: "hardcoded",
        creationTime: new Date(),
        lastActivity: new Date(),
        p: utils.string2Food(dummyPublicKey)
    };

    const randomSkip = 0 // _.random(0, 20);
    const picks = _.random(1, 10) + 20;
    const mongoc = await mongo3.clientConnect();
    const exists = await mongo3.readOne(mongoc,
        nconf.get('schema').supporters, { publicKey: dummyPublicKey });

    if(!exists || !exists.publicKey) {
        debug("Creating our fake profile for the public");
        await mongo3.writeOne(mongoc,
            nconf.get('schema').supporters, supporter);
    } else {
        debug("dummy profile exists! using %d skips and looking for %d samples",
            randomSkip, picks);
    }

    const meta = await mongo3.readLimit(mongoc, nconf.get('schema').metadata, {
        title: { $exists: true }, version: 2
    }, {}, picks, randomSkip);

    debug("Found %d metadata matching our criteria", _.size(meta));
    if(!_.size(meta))
        process.exit(0);

    const anonymized = _.map(meta, function(e) {
        _.unset(e, '_id');
        e.watcher = "dummy";
        e.publicKey = dummyPublicKey;
        e.id = moment()
            .format("YYYYMMDDHHmmSS") + "0000000000000iii" + e.id.substr(0, 8);
        e.clientTime = e.savingTime = new Date();
        return e;
    });

    const current = await mongo3.count(mongoc, nconf.get('schema').metadata, {
        publicKey: dummyPublicKey
    });

    if( (current + _.size(anonymized)) > maxVideos) {
        debug("Currently there are %d videos. plus %d, this will be > than %d",
            current, _.size(anonymized), maxVideos);
        // TODO, delete old entries
    } else {
        debug("Currently there are %d videos. plus %d (max %d)",
            current, _.size(anonymized), maxVideos);
    }

    try {
        await mongo3.insertMany(mongoc, nconf.get('schema').metadata, anonymized);
        debug("Written %d anonymized entries", _.size(anonymized))
    } catch(e) {
        const check = await mongo3.count(mongoc, nconf.get('schema').metadata, {
            publicKey: dummyPublicKey
        });
        debug("Error <objects available %d>\n%s", check, e.message);
    }
    await mongoc.close();
}

try {
    debug("Starting");
    updatePublicProfile();
} catch(e) {
    console.log(e);
    process.exit(1);
}
