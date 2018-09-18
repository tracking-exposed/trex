var _ = require('lodash');
var moment = require('moment');
var Promise = require('bluebird');
var debug = require('debug')('lib:events');
var os = require('os');
var fs = Promise.promisifyAll(require('fs'));
var nconf = require('nconf');

var signer = require('nacl-signature');
var bs58 = require('bs58');

var mongo = require('./mongo');
var utils = require('./utils');
var alarms = require('./alarms');


function hasError(retDict) {
    return (!_.isUndefined(_.get(retDict, 'error')));
};

function reportError(where, err) {
    debug("%s Error detected and raised %s: %s",
        req.randomUnicode, where, err);
    return alarms.reportAlarm({
        caller: 'events',
        what: where,
        info: err
    })
    .then(function() {
        throw new Error(where + '-' + err);
    });
};

function processHeaders(received, required) {
    var ret = {};
    var errs = _.map(required, function(destkey, headerName) {
        var r = _.get(received, headerName);
        if(_.isUndefined(r))
            return headerName;

        _.set(ret, destkey, r);
        return null;
    });
    errs = _.compact(errs);
    if(_.size(errs)) {
        debug("Error in processHeaders: %j", errs);
        return { 'errors': errs };
    }
    return ret;
};

function saveVideo(body, supporter) {

    var id = utils.hash({
        pubkey: supporter.publicKey,
        href: body.href,
        hour: moment(body.clientTime).format("YYYY-MM-DD HH:mm:SS"),
    });
    var isVideo = body.href.match(/v=/) ? true : false;
    var fdest = 'htmls/' + moment().format("YYYY-MM-DD") + "/" + id + ".html";
    var video = {
        id: id,
        href: body.href,
        isVideo: isVideo,
        htmlOnDisk: fdest,
        incremental: body.incremental,
        cookieId: supporter.cookieId,
        publicKey: supporter.publicKey,
        tagId: body.tagId,
        clientTime: new Date(body.clientTime),
        savingTime: new Date(),
    };

    if(isVideo)
        video.videoId = _.replace(body.href, /.*v=/, '');

    debug("Saving video %d (id %s) for user %s in file %s (%d bytes)",
        video.incremental, video.videoId, video.cookieId, fdest, _.size(body.element)
    );

    return mongo
        .writeOne(nconf.get('schema').videos, video)
        .tap(function() {
            return fs.writeFileAsync(fdest, body.element)
        })
        .catch(function(error) {
            debug("Error: %s", error);
        })
        .return(video.incremental);
};

function processEvents(req) {

    debug("Processing event");

    var headers = processHeaders(_.get(req, 'headers'), {
        'content-length': 'length',
        'x-yttrex-build': 'build',
        'x-yttrex-version': 'version',
        'x-yttrex-nonauthcookieid': 'supporterId',
        'x-yttrex-publickey': 'publickey',
        'x-yttrex-signature': 'signature'
    });

    if(hasError(headers))
        reportError('header parsing, missing', headers.error);

    var cookieId = _.get(req.headers, 'x-yttrex-nonauthcookieid');

    return mongo
        .read(nconf.get('schema').supporters, {
            publicKey: headers.publickey
        })
        .then(function(supporterL) {
            if(!_.size(supporterL)) {
                debug("new publicKey received!");
                var supporter = {
                    publicKey: headers.publickey,
                    creationTime: new Date(),
                };
                return mongo
                    .writeOne(nconf.get('schema').supporters, supporter)
                    .return( [ supporter ] )
            }
            return supporterL;
        })
        .then(_.first)
        .then(function(supporter) {
            if (!utils.verifyRequestSignature(req)) {
                debug("Verification fail: signed %s pubkey %s",
                    headers.signature, supporter.publicKey);
                throw new Error('Signature does not match request body');
            }

            supporter.version = headers.version;
            supporter.lastActivity = new Date();

            return supporter;
        })
        .tap(function(supporter) {
            return mongo.updateOne(nconf.get('schema').supporters, {
                publicKey: supporter.publickey
            }, supporter);
        })
        .tap(function(supporter) {
            /* directory check */
            var ddest = 'htmls/' + moment().format("YYYY-MM-DD") + "/";

            return fs
                .mkdirAsync(ddest).catch(function(e) { });
        })
        .then(function(supporter) {
            return Promise.map(req.body, function(video) {
                return saveVideo(video, supporter);
            });
        })
        .then(function(results) {
            return { "json": {
                "status": "OK",
                "info": results
            }};
        })
        .catch(function(error) {
            debug("Event submission ignored: %s", error.message);
            return { 'json': {
                'status': 'error',
                'info': error.message
            }};
        });
};

module.exports = {
    processEvents: processEvents
};
