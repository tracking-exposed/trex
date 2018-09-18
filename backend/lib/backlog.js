var _ = require('lodash');
var moment = require('moment');
var Promise = require('bluebird');
var debug = require('debug')('lib:backlog');
var nconf = require('nconf');

var mongo = require('./mongo');
var utils = require('./utils');

function getUserBacklog(req) {
    var c =  req.params.publicKey;
    debug("Quertying backlog for user %s", c);
    return mongo
        .readLimit(nconf.get('schema').videos, { publicKey: c }, {}, 200, 0)
        .map(function(video) {
            return _.omit(video, ['_id', 'htmlOnDisk', 'publicKey' ]);
        })
        .then(_.reverse)
        .then(function(videos) {
            return { json: videos };
        });
};

module.exports = {
    getUserBacklog: getUserBacklog
};
