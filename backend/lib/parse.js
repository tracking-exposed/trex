const _ = require('lodash');
const Promise = require('bluebird');
const debug = require('debug')('lib:parse');
const moment = require('moment');
const nconf = require('nconf'); 
const JSDOM = require('jsdom').JSDOM;
const fs = Promise.promisifyAll(require('fs'));

const videoparser = require('../parsers/video');
const mongo = require('./mongo');
const echoes = require('./echoes');
const utils = require('./utils');
const glue = require('./glue');

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

function parseHTML(htmlfilter, repeat) {
    /* retrive the HTML from db/file/remote and apply many of the processing functions */
    return mongo
        .read(nconf.get('schema').videos, htmlfilter)
        .map(function(metainfo) {

            if(!metainfo.isVideo) {
                debug("url [%s] not supported right now", metainfo.href);
                metainfo.processed = false;
                return { impression: metainfo };
            }

            return fs
                .readFileAsync(metainfo.htmlOnDisk, { encoding: 'utf8'})
                .then(function(content) {
                    debug("%s href %s with %s html bytes",
                        metainfo.id, metainfo.href, _.size(content));
                    let envelop = {
                        impression: metainfo,
                        jsdom: new JSDOM(content.replace(/\n\ +/g, '')).window.document,
                    };
                    let metadata = videoparser.process(envelop);

                    envelop.metadata = metadata;
                    envelop.impression.processed = true;
                    envelop.metadata.id = envelop.impression.id;
                    envelop.metadata.videoId = envelop.impression.videoId;
                    envelop.metadata.watcher = envelop.impression.p;
                    envelop.metadata.savingTime = envelop.impression.savingTime;
                    // TODO: extract URL metadata, such as &t=502s 
                    _.unset(envelop, 'jsdom');
                    return envelop;
                })
                .catch(function(error) {
                    debug("catch error in %s: %s", metainfo.id, error.message);
                    console.log("%s", error.stack);
                    debugger;
                    metainfo.processed = false;
                    return { impression: metainfo };
                });
        }, { concurrency: 1 })

        /* this is the function processing the parsers
         * it is call of every .id which should be analyzed */

        .catch(function(error) {
            debug("[E] Unmanaged error in parser sequence: %s", error.message);
            console.log(error.stack);
            return null;
        })
        .tap(logSummary)
        .map(save, { concurrency: 1 })
        .catch(function(error) {
            debug("[error after parsing] %s", error.message);
            console.log(error.stack);
            process.exit(1);
        });
}

module.exports = {
    checkMetadata: checkMetadata,
    mergeHTMLImpression: mergeHTMLImpression,
    logSummary: logSummary,
    save: save,
    parseHTML: parseHTML,
};
