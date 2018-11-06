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
    var filter = { testId: testId, name: name};
    debug("Looking for sequence %j, (tabtime %d seconds)", filter, tabtime);
    return fetchSequences(filter)
        .then(function(sequence) {

            var seconds = ( _.size(sequence) * tabtime);
            var humanized = moment.duration({ seconds: seconds }).humanize();
            return {
                json: {
                    testId: testId,
                    testName: name,
                    list: sequence,
                    humanize: humanized,
                    seconds: seconds,
                    tabtime: tabtime,
                    producer: _.first(sequence).userPseudo
                } 
            };
        })
        .catch(function(error) {
            debug("Error in getSequence: %s", error.message);
            return { json: { error: true } };
        });
};

function getResults(req) {
    var testId =  _.parseInt(req.params.testId);
    var filter = { testId: testId };
    debug("Looking for results of testId %d", testId);

    var name = null;

    return fetchSequences(filter)
        .map(function(sequence) {

            /* look at the detail video to retrieve the `related` videos */
            return mongo
                .read(nconf.get('schema').videos, { id: sequence.id })
                .then(_.first)
                .then(function(v) {
                    var videoFields = [ 'authorName', 'videoId', 'href', 'savingTime', 'title' ];
                    var ret = _.pick(v, videoFields);
                    var relatedFields = ['index', 'source', 'title', 'videoId'];

                    ret.related = _.map(v.related, function(r) {
                        return _.pick(r, relatedFields);
                    });
                    ret.p = sequence.p;
                    ret.testId = sequence.testId;

                    if(_.isNull(name) && !_.isUndefined(sequence.first))
                        name = sequence.name;

                    return ret;
                });
        }, { concurrency: 10})
        .then(function(ret) {
            var range = _.map(_.map(ret, 'savingTime'), function(t) {
                return {
                    date: new Date(t),
                    h: moment(t).format('DD/MMM'),
                    farago: moment.duration(moment(t) - moment()).humanize()
                };
            });
            range = _.orderBy(range, 'date');
            debug("Test %s, evidences: %d", name, _.size(ret));
            return { json: {
                name: name,
                evidences: ret,
                first: _.first(range),
                last: _.last(range)
            } };
        });
};

function verifyVideoIds(ids) {
    var kept = [ 'href', 'savingTime', 'id', 'videoId', 'title', 'authorName', 'authorSource' ];
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

    debug("Creating new sequence, key %s, videos %d | %s", publicKey, _.size(ids), name);
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
                throw new Error("No valid videos/user combo offered");
        })
        .then(function(mixes) {
            debug("Validated %d videos from supporter %s", _.size(mixes.videos), _.size(mixes.user.p) );
            var id =  _.random(0, 0xffffffff);
            var sequence = _.map(mixes.videos, function(v, i) {
                v.first = true;
                v.p = mixes.user.p;
                v.name = name;
                v.order = i + 1;
                v.testId = id;
                /* and v is become a 'sequence' */
                return v;
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

    var seqIds= _.map(_.keys(_.countBy(sequences, 'id')), _.parseInt);
    debug("findLastDivergenciesUpdates on tests: %s", seqIds);
    return mongo
        .readLimit(nconf.get('schema').sequences, { 'testId': { "$in" : seqIds }}, { savingTime: -1 }, 0, 1)
        .then(function(rets) {
            console.log(_.size(rets));
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
