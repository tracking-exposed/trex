var _ = require('lodash');
var moment = require('moment');
var Promise = require('bluebird');
var debug = require('debug')('lib:divergency');
var nconf = require('nconf');

var mongo = require('./mongo');
var utils = require('./utils');

function getSequence(req) {
    var testId =  req.params.testId;
    debug("Looking for sequence test: %s", testId);
    return mongo
        .readLimit(nconf.get('schema').sequences, { testId: testId }, {}, 1, 0)
        .then(_.first)
        .then(function(sequence) {
            return { json: sequence };
        });
};

module.exports = {
    getSequence: getSequence
};
