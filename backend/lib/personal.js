const _ = require('lodash');
const moment = require('moment');
const Promise = require('bluebird');
const debug = require('debug')('lib:personal');
const nconf = require('nconf');

const mongo = require('./mongo');
const utils = require('./utils');
const params = require('./params');

function getPersonal(req) {

    const k =  req.params.publicKey;
    const { amount, skip } = params.optionParsing(req.params.paging, 40);
    debug("Personal access, amount %d skip %d", amount, skip);

    if(_.size(k) < 30)
        return { json: { "message": "Invalid publicKey", "error": true }};

    return mongo
        .read(nconf.get('schema').supporters, { publicKey: k })
        .then(_.first)
        .then(function(profile) {
            if(!profile)
                throw new Error("publicKey do not match any user");

            return mongo
                .readLimit(nconf.get('schema').metadata, { watcher: profile.p }, { savingTime: -1 }, amount, skip)
                .map(function(m) {
                    let r = _.omit(m, ['_id']);
                    r.related = _.map(r.related, function(entry) { return _.omit(entry, ['mined']); });
                    r.relative = moment.duration( moment(m.savingTime) - moment() ).humanize() + " ago";
                    return r;
                })
                .then(function(metadata) {
                    return { json: {
                        profile: _.omit(profile, ['_id']),
                        metadata,
                    } };
                });
        })
        .catch(function(error) {
            debug("error: %s", error.message);
            return { json: {
                    "message": error.message,
                    "error": true
                }
            };
        });
};

module.exports = {
    getPersonal,
};
