#!/usr/bin/env node
var _ = require('lodash');
var moment = require('moment');
var debug = require('debug')('linker');
var nconf = require('nconf');

var mongo = require('../lib/mongo');
var parse = require('../lib/parse');

nconf.argv().env().file({ file: 'config/settings.json' });
/*
 * 1) when an user select videos creates a 'sequence'
 * 2) when another user open a test page, a sequence is display, and it is created a 'commitment'
 * 3) here the new video processed get (eventually) linked to their sequence if a 'commitment' is found
 */

function checkLinking(metadata, html) {

    return mongo.read(nconf.get('schema').commitments, {
        videoId: metadata.videoId,
        p: metadata.p
    })
    .then(_.first)
    .then(function(found) {
        if(!_.size(found))
            return false;

        return mongo
            .writeOne(nconf.get('schema').sequences, {
                p: found.p,
                videoId: found.videoId,
                id: metadata.id,
                testId: _.parseInt(found.testId),
                savedAt: new Date(metadata.savingTime),
            })
            .return(true);
    })
    .then(function(result) {
        return { linker: result };
    });
};

var linkable = {
    name: 'linker',
    requirements: { isVideo: true },
    implementation: checkLinking,
    since: "2018-10-13",
    until: moment().format('YYYY-MM-DD 23:59:59')
};

return parse.please(linkable)
