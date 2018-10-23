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
        publicKey: supporter.publicKey,
        p: supporter.p,
        tagId: body.tagId,
        clientTime: new Date(body.clientTime),
        savingTime: new Date(),
    };

    if(isVideo)
        video.videoId = _.replace(body.href, /.*v=/, '');

    debug("Saving entry (videos: %s) user %s file %s (%d bytes)",
        isVideo ? video.videoId : "false", supporter.p, fdest, _.size(body.element)
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

    var headers = processHeaders(_.get(req, 'headers'), hdrs);

    if(hasError(headers)) {
        debug("Error detected: %s", headers.error);
        return { 'json': {
            'status': 'error',
            'info': headers.error
        }};
    }

    return mongo
        .read(nconf.get('schema').supporters, {
            publicKey: headers.publickey
        })
        .then(function(supporterL) {
            if(!_.size(supporterL))
                return TOFU(headers.publickey);
            else
                return supporterL;
        })
        .then(_.first)
        .then(function(supporter) {
            if (!utils.verifyRequestSignature(req)) {
                debug("Verification fail for use [%s] (signature %s)",
                    supporter.p, headers.signature);
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
            })
            .then(function(results) {
                /* this is what returns to the web-extension */
                return { json: {
                    status: "OK",
                    supporter: supporter,
                    results: results
                }};
            });
        })
        .catch(function(error) {
            debug("Error in managing submission: %s", error.message);
            return { json: {
                status: 'error',
                info: error.message
            }};
        });
};

const hdrs =  {
    'content-length': 'length',
    'x-yttrex-build': 'build',
    'x-yttrex-version': 'version',
    'x-yttrex-nonauthcookieid': 'supporterId',
    'x-yttrex-publickey': 'publickey',
    'x-yttrex-signature': 'signature'
};

function TOFU(pubkey) {
    var pseudo = utils.string2Food(pubkey);
    var supporter = {
        publicKey: pubkey,
        creationTime: new Date(),
        p: pseudo
    };
    debug("TOFU: new publicKey received, from: %s", pseudo);
    return mongo
        .writeOne(nconf.get('schema').supporters, supporter)
        .return( [ supporter ] )
};


module.exports = {
    processEvents: processEvents,
    hdrs: hdrs,
    processHeaders: processHeaders,
    TOFU: TOFU
};
