const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('routes:statistics');
const nconf = require('nconf');

const mongo = require('../lib/mongo');

function statistics(req) {
    // the content in 'stats' is saved by count-o-clock and the selector here required is
    // specifiy in config/stats.json
    const expectedFormat = "/api/v2/statistics/:name/:unit/:amount";

    const allowedNames = [ 'supporters', 'active', 'contributions',
                           'sizes', 'home-metadata', 'video-metadata', 'processing' ];
    const name = req.params.name;
    if(allowedNames.indexOf(name) == -1) {
        debug("Error! this might not appear in visualization: investigate on why an invalid stat-name is called by c3! (%s)", name);
        return { json: { error: true, expectedFormat, allowedNames, note: `the statistic name you look for was ${name}` }}
    }

    const unit = req.params.unit;
    const allowedRanges = ['hours', 'hour', 'day', 'days'];
    if(allowedRanges.indexOf(unit) == -1 ) {
        debug("Error! this might not appear in visualization, but the API call has a malformed time-unit!");
        return { json: { error: true, expectedFormat, allowedRanges, note: `the statistic unit you look for was ${unit}` }}
    }

    const amount = _.parseInt(req.params.amount);
    if(_.isNaN(amount)) {
        debug("Error! this might not appear in visualization, but the API call has an invalid number!");
        return { json: { error: true, expectedFormat, invalidNumber: req.params.amount }};
    }

    const filter = { name };
    const refDate = new Date( moment().subtract(amount, _.nth(unit, 0)));

    if(_.startsWith(unit, 'day'))
        _.set(filter, 'day', { '$gt': refDate });
    else
        _.set(filter, 'hour', { '$gt': refDate });

    return mongo
        .read(nconf.get('schema').stats, filter)
        .map(function(e) {
            return _.omit(e, ['_id'])
        })
        .then(function(content) {
            debug("Requested [%s] since %d %s ago = %d samples",
                name, amount, unit, _.size(content));
            return {
                json: content,
                headers: { amount, unit, name }
            };
        });
}

module.exports = {
    statistics
};
