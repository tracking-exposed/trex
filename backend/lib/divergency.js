var _ = require('lodash');
var moment = require('moment');
var Promise = require('bluebird');
var debug = require('debug')('lib:divergency');
var nconf = require('nconf');

var mongo = require('./mongo');
var utils = require('./utils');

function fetchSequences(filter) {
    var MAX = 800
    return mongo
        .readLimit(nconf.get('schema').sequences, filter, {}, MAX, 0)
        .tap(function(r) {
            if(_.size(r) === MAX)
                debug("Limit triggered, should be reported to the user/managed somehow");
        });
};

function getSequence(req) {
    var testId =  _.parseInt(req.params.testId);
    var name = req.params.name;
    var tabtime = _.parseInt(nconf.get('tabtime'));
    var filter = { id: testId, name: name};
    debug("Looking for sequence %j, (tabtime %d seconds)", filter, tabtime);
    return fetchSequences(filter)
        .then(function(sequence) {

            var seconds = (_.size(sequence) * tabtime);
            var humanized = moment.duration({ seconds: seconds }).humanize();
            return {
                json: {
                    testId: testId,
                    testName: name,
                    list: sequence,
                    humanize: humanized,
                    seconds: seconds,
                    tabtime: tabtime,
                    producer: sequence[0].userPseudo
                } 
            };
        });
};

function getResults(req) {
    var testId =  _.parseInt(req.params.testId);
    var name = req.params.name;
    var filter = { id: testId };
    debug("Looking for results %j", filter);
    // this is wrong at the moment, all the results based on videoId should not be returned 
    // only the proper videos.id linked in the sequences should
    return fetchSequences(filter)
        .map(function(sequence) {
            return mongo.read(nconf.get('schema').sequences, { id: sequence.videoId });
        }, { concurrency: 20})
        .then(_.flatten)
        .then(function(videos) {
            return { json: videos };
        });
};

function verifyVideoIds(ids) {
    var kept = [ 'href', 'savingTime', 'id', 'title', 'authorName', 'authorSource' ];
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
            var id =  _.random(0, 0xffffffff);
            var sequence = _.map(mixes.videos, function(v, i) {
                var retv = _.omit(v, ['id']);
                retv.videoId = v.id;
                retv.first = true;
                retv.p = mixes.user.p;
                retv.name = name;
                retv.order = i + 1;
                return retv;
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

function findLastDivergenciesUpdates(sequences) {

    var seqIds= _.keys(_.countBy(sequences, 'id'));
    return mongo
        .readLimit(nconf.get('schema').sequences, { 'id': { "$in" : seqIds }}, { creationTime: -1 }, 0, 1)
        .then(function(rets) {
            debugger;
            return rets;
        });
}

module.exports = {
    /* called by personal.js, for their own generated seqs */
    fetchSequences: fetchSequences,
    /* getSequence is call with :testId, :name and is used in /dD/ page */
    getSequence: getSequence,
    /* when a sequence is created */
    createSequence: createSequence,
    /* used by /[rR]/ page, results about a :testId :name, calls `fetchSequence` */
    getResults: getResults,
    /* function used in personal.js for get additional information to the user */
    findLastDivergenciesUpdates: findLastDivergenciesUpdates,
};
