var _ = require('lodash');
var moment = require('moment');
var Promise = require('bluebird');
var debug = require('debug')('lib:alarms');
var os = require('os');
var nconf = require('nconf');
 
var mongo = require('./mongo');
var utils = require('./utils');

function getAlarms(req) {

    debug("getAlarms (only 1 days history is kept by mongo)");

    return mongo
        .read(nconf.get('schema').alarms)
        .then(function(alarms) {
            debug("Retrived %d alarm",
                _.size(alarms));
            return { json: _.reverse(alarms) };
        });
}


module.exports = {
    getAlarms: getAlarms
};
