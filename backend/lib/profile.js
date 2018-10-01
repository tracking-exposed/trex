var _ = require('lodash');
var moment = require('moment');
var Promise = require('bluebird');
var debug = require('debug')('lib:profile');
var nconf = require('nconf');

var mongo = require('./mongo');
var utils = require('./utils');

function fetchProfile(publicKey) {
    return mongo
        .readLimit(nconf.get('schema').supporters, {publicKey: publicKey}, {}, 1, 0)
        .then(_.first);
};

function getProfile(publicKey) {
    debug("getProfile publicKey %s", publicKey);

    return fetchProfile(publicKey)
        .then(function(supporter) {
            return { json: supporter };
        });
};

module.exports = {
    fetchProfile: fetchProfile,
    getProfile: getProfile
};
