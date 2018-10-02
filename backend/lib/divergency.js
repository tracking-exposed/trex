var _ = require('lodash');
var moment = require('moment');
var Promise = require('bluebird');
var debug = require('debug')('lib:divergency');
var nconf = require('nconf');

var mongo = require('./mongo');
var utils = require('./utils');

function fetchSequences(filter) {
    return mongo
        .readLimit(nconf.get('schema').sequences, filter, {}, 400, 0)
        .tap(function(r) {
            if(_.size(r) === 400)
                debug("Limit triggered, should be reported to the user");
        });
};

function getSequence(req) {
    var testId =  _.parseInt(req.params.testId);
    var name = req.params.name;

    var filter = { id: testId, name: name};
    debug("Looking for sequence %j", filter);

    return fetchSequences(filter)
        .then(function(sequence) {
            return { json: sequence };
        });
};

function verifyVideoIds(ids) {
    var kept = [ 'href', 'savingTime', 'id', 'title' ];
    return Promise.map(ids, function(id) {
        return mongo
            .read(nconf.get('schema').videos, { id: id })
    }, { concurrency: 1 })
    .then(_.flatten)
    .map(function(video) {
        return _.pick(video, kept);
    });
};

function createSequence(req) {

    var ids = req.params.idList.split('-');
    var publicKey = req.params.publicKey;
    var name = req.params.name;

    debug("requested new sequence! key %s, videos %d | %s", publicKey, _.size(ids), name);

    return mongo
        .read(nconf.get('schema').supporters, { publicKey: publicKey })
        .then(_.first)
        .tap(function(user) {
            if(!user)
                throw new Error("Invalid publicKey");
        })
        .then(function(user) {
            return verifyVideoIds(ids)
                .then(function(videos) {
                    return { videos: videos, user: user };
                });
        })
        .tap(function(mixes) {
            if(!_.size(mixes.videos))
                throw new Error("No valid video Id offered");
        })
        .then(function(mixes) {

            var id = _.random(0x1000, 0xffff);
            var sequence = _.map(mixes.videos, function(v, i) {
                return {
                    order: i + 1,
                    userPseudo: mixes.user.p,
                    id: id,
                    videoId: v.id,
                    href: v.href,
                    first: true,
                    name: name
                };
            });
                
            return mongo
                .writeMany(nconf.get('schema').sequences, sequence)
                .return({
                    json: { 'url': '/d/' + id + '/' + name }
                });
        })
        .catch(function(error) {
            return { json: { error: error.message }};
        });
};

module.exports = {
    fetchSequences: fetchSequences,
    getSequence: getSequence,
    createSequence: createSequence
};
