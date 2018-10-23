var _ = require('lodash');
var moment = require('moment');
var Promise = require('bluebird');
var debug = require('debug')('lib:backlog');
var nconf = require('nconf');

var mongo = require('./mongo');
var utils = require('./utils');

function fetchBacklog(pubKeyString, amount) {

    return mongo
        .readLimit(nconf.get('schema').videos, { publicKey: pubKeyString }, { savingTime: -1}, amount, 0)
        .tap(function(videos) {
            if(!_.size(videos))
                throw new Error("No video submitted by this publicKey can be found");
        })
        .map(function(video) {
            return _.omit(video, ['_id', 'htmlOnDisk', 'publicKey' ]);
        });
};

function getUserBacklog(req) {
    var c =  req.params.publicKey;
    const amount = 200;
    debug("Querying last %d videos for user key %s", amount, c);
    return fetchBacklog(c, amount)
        .then(function(videos) {
            return { json: videos };
        });
};

module.exports = {
    fetchBacklog: fetchBacklog,
    getUserBacklog: getUserBacklog
};
