var _ = require('lodash');
var moment = require('moment');
var Promise = require('bluebird');
var debug = require('debug')('lib:divergency');
var nconf = require('nconf');

var mongo = require('./mongo');
var utils = require('./utils');

function fetchSequences(filter, amount) {
    return mongo
        .readLimit(nconf.get('schema').sequences, filter, {}, amount, 0);
};

function getSequence(req) {
    var testId =  req.params.testId;
    debug("Looking for sequence test: %s", testId);

    return fetchSequences({ testId: testId}, 1)
        .then(_.first)
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

    debug("requested new sequence! key %s, videos %d", publicKey, _.size(ids));

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

            var userPseudo = utils.string2Food(mixes.user.publicKey);
            var id = _.random(0x100000, 0xffffff);

            var sequence = _.map(mixes.videos, function(v, i) {
                return {
                    order: i + 1,
                    userPseudo: userPseudo,
                    id: id,
                    videoId: v.id,
                    href: v.href,
                    first: true
                };
            });
                
            return mongo
                .writeMany(nconf.get('schema').sequences, sequence)
                .then(function(rv) {
                    debug("%s", JSON.stringify(rv));
                    debug("%s", JSON.stringify(sequence));
                    return {
                        json: { 'url': '/d/' + id }
                    };
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
