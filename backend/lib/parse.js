const _ = require('lodash');
const Promise = require('bluebird');
const debug = require('debug')('lib:parse');
const debugUnsupported = require('debug')('lib:parse:UNSUPPORTED');
const debugError = require('debug')('lib:parse:ERROR');
const nconf = require('nconf'); 
const JSDOM = require('jsdom').JSDOM;
const fs = Promise.promisifyAll(require('fs'));

const videoparser = require('../parsers/video');
const mongo = require('./mongo');
const echoes = require('./echoes');

nconf.argv().env().file({ file: 'config/content.json' });

function checkMetadata(impression, repeat) {
    /* this function return an impression if, and only if
       we HAVE to process it. when the 'repeat' is true, 
       a present metadata would be remove and the tested
       impression is returned */
    if(_.isUndefined(impression.id))
        throw new Error("impression missing");

    return mongo
        .readOne(nconf.get('schema').metadata, { id: impression.id })
        .then(function(i) {
            if( _.get(i, 'id') === impression.id && !repeat) {
                debug("metadata [%s] already exists: skipping", i.id);
                return null;
            }

            if( _.get(i, 'id') === impression.id && repeat) {
                debug("metadata [%s] exists, but repeat is requested", i.id);
                return mongo
                    .remove(nconf.get('schema').metadata, { id: impression.id })
                    .return(impression);
            }

            /* else if _.isUndefined(i) is returned the impression */
            return impression;
        });
}


function logSummary(blobs) {
    return null;
    /* echoes to ELK */
    
    _.each(blobs.summary, function(e) {
        echoes.echo(
            _.extend({'index': 'parserv' },
            _.pick(e, ['errors', 'type', 'publicationTime', 'postId',
                       'permaLink', 'author', 'textlength', 'impressionTime',
                       'impressionOrder', 'pseudo', 'timeline', 'regexp' ])
            )
        );
    });

    /* the `fulldump` is set by executers or by `parsers/precise.js` */
    if(nconf.get('fulldump'))
        _.times(_.size(blobs.metadata), function(o, i) {
            let s = _.nth(blobs.summary, i);
            console.log(JSON.stringify(s, undefined, 1));
            console.log("\x1b[36m");
            let m = _.nth(blobs.metadata, i);
            console.log(JSON.stringify(m, undefined, 1));
        });

    /* this is dumped even without fulldump */
    const E = "\x1b[47m\x1b[31m";
    _.each(blobs.errors, function(o) {
        console.log(E, JSON.stringify(o, undefined, 2));
    });
}

function save(envelop) {
    /* record changes on the:
     * - metadata, they are the new entry
     * - update the video entry */

    let commits = [
        mongo.updateOne(nconf.get('schema').videos, { id: envelop.impression.id }, envelop.impression)
    ]

    if(envelop.metadata && (envelop.metadata.id == envelop.impression.id ))
        commits.push(
            mongo.upsertOne(nconf.get('schema').metadata, { id: envelop.metadata.id }, envelop.metadata)
        );

    return Promise.all(commits);
}

function mergeHTMLImpression(html) {
    return mongo
        .readOne(nconf.get('schema').impressions, { id: html.impressionId })
        .then(function(impression) {
            _.unset(impression, 'id');
            _.unset(impression, 'htmlId');
            return _.merge(html, impression);
        });
}

module.exports = {
    checkMetadata: checkMetadata,
    mergeHTMLImpression: mergeHTMLImpression,
    logSummary: logSummary,
    save: save,
};
