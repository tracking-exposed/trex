var _ = require('lodash');
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var request = Promise.promisifyAll(require('request'));
var cheerio = require('cheerio');
var debug = require('debug')('lib:parse');
var moment = require('moment');
var nconf = require('nconf'); 

var mongo = require('./mongo');
nconf.argv().env().file({ file: "config/settings.json" });

function fetchMetadata(config) {

    var defaults = {
        "since": moment().subtract(1, 'h').toISOString(),
        "until": moment().format('YYYY-MM-DD 23:59:59'),
        "parserName": config.name,
        "requirements": config.requirements || {}
    };

    /* if since or until are specify, use the command, 
     * otherwise use keep the default: last hour */
    if( nconf.get('since') || nconf.get('until') ) {
        debug("Remind: if you specify only one 'since' or 'until', the default is from the config");
        defaults.since = nconf.get('since') ? nconf.get('since') : config.since;
        defaults.until = nconf.get('until') ? nconf.get('until') : config.until;
    }

    /* id overwrites every other requirement */
    if(nconf.get('id')) {
        debug("Remind: when id is specified, other selectors are ignored");
        // XXX never tested this  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        defauls.since = "2018-01-01";
        defaults.until = moment().format("YYYY-MM-DD 23:59:59");
        defaults.requirements = { id : nconf.get('id') };
    }

    debug("⭐ %s", JSON.stringify(defaults, undefined, 2));

    return mongo
        .read(nconf.get('schema').videos, _.extend({
                savingTime: {
                    '$gte': new Date(defaults.since),
                    '$lte': new Date(defaults.until) 
                }
            },
            _.get(defaults, 'requirements'),
            _.set({}, defaults.parserName, {'$exists': false} )))
        .tap(function(results) {
            debug("matched %d objects to be parsed", _.size(results));
        });
};

function report(text, objs) {
    debug("%s: %d", text, _.size(objs));
};

function please(config) {

    /* set default values if not specified */
    config.repeat = nconf.get('repeat') || null;

    if(!_.isObject(config.requirements)) {
        throw new Error(
            "Developer, requirements has to be an object and check `repeat`");
    }

    return fetchMetadata(config)
        .map(function(metadata) {
            return fs
                .readFileAsync(metadata.htmlOnDisk, 'utf-8')
                .then(function(html) {
                    return config.implementation(metadata, html);
                })
                .catch(function(error) {
                    debug("Error %s", error.message);
                    // debug("Error %s", JSON.stringify(metadata, undefined, 2), error.message);
                    return null;
                })
        }, { concurrency: 1 })
        .tap(report("returned elements"))
        .then(_.compact)
        .tap(report("analyzed elements"))
        .map(function(processed) {
            return mongo
                .updateOne(nconf.get('schema').videos, {_id: processed._id}, processed);
        }, { concurrency: 1 });
};

module.exports = {
    please: please
};
