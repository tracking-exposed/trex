var _ = require('lodash');
var moment = require('moment');
var Promise = require('bluebird');
var debug = require('debug')('lib:personal');
var nconf = require('nconf');

var mongo = require('./mongo');
var utils = require('./utils');
var fetchBacklog = require('./backlog').fetchBacklog;
var fetchSequences = require('./divergency').fetchSequences;
var findLastDivergenciesUpdates = require('./divergency').findLastDivergenciesUpdates;
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
    var backlogLIMIT = 50;
    var sequencesLIMIT = 20;

    debug("personal access for user %s", c);
    return fetchProfile(c)
        .then(function(profile) {
            if(!profile)
                throw new Error("Public key do not match any user");

            return Promise.all([
                fetchBacklog(profile.publicKey, 40),
                fetchSequences({ p: profile.p, first: true }, 400).then(findLastDivergenciesUpdates),
                profile
            ]);
        })
    .tap(function(all) {
        if( _.size(all[0]) == 400 || _.size(all[1]) === 400 )
            debug("Warning: limit 400 received! backlog %d, sequences %d", _.size(all[0]), _.size(all[1]) );
    })
    .then(function(all) {
        return {
            json: {
                backlog: all[0],
                sequences: all[1],
                profile: all[2]
            }
        };
    })
    .catch(function(error) {
        debug("Error: %s", error.message);
        return { json: {
                "message": error.message,
                "error": true
            }
        };
    });
};

module.exports = {
    getPersonalBlob: getPersonalBlob
};
