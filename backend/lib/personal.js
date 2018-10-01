var _ = require('lodash');
var moment = require('moment');
var Promise = require('bluebird');
var debug = require('debug')('lib:personal');
var nconf = require('nconf');

var mongo = require('./mongo');
var utils = require('./utils');
var fetchBacklog = require('./backlog').fetchBacklog;
var fetchSequences = require('./divergency').fetchSequences;
var fetchProfile = require('./profile').fetchProfile;

/* 
 * this is high-level API which return a bit of everything:
 *   - the last updated sequences where an user participate
 *   - the last sequences owned by the user
 *   - few user profile detail
 *   - the most recent videos 
 * 
 * this API is intended for the /personal/:publicKey access 
 */

function getPersonalBlob(req) {
    var c =  req.params.publicKey;

    debug("personal access for user %s", c);
    return Promise.all([
        fetchBacklog(c, 25),
        fetchSequences({ publicKey: c}, 5),
        fetchProfile(c)
    ])
    .tap(function(all) {
        // debugger;
    })
    .then(function(all) {
        return {
            json: {
                backlog: all[0],
                sequences: all[1],
                profile: all[2]
            }
        };
    });
};

module.exports = {
    getPersonalBlob: getPersonalBlob
};
