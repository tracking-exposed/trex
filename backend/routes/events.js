var _ = require('lodash');
var moment = require('moment');
var Promise = require('bluebird');
var debug = require('debug')('lib:events');
var os = require('os');

var fs = Promise.promisifyAll(require('fs'));
var path = require('path');
var nconf = require('nconf');

var signer = require('nacl-signature');
var bs58 = require('bs58');

const automo = require('../lib/automo');
var mongo = require('../lib/mongo');
var utils = require('../lib/utils');
var security = require('../lib/security');

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
    var fdest = path.join(
        nconf.get('storage'), moment().format("YYYY-MM-DD"), `${id}.html`
        //    htmls /           2019-01-01         / $hash.html
    );
    var video = {
        id: id,
        href: body.href,
        isVideo,
        htmlOnDisk: fdest,
        p: supporter.p,
        clientTime: new Date(body.clientTime),
        savingTime: new Date(),
    };

    if(supporter.tag)
        video.tagId = supporter.tag.id;

    if(isVideo)
        video.videoId = _.replace(body.href, /.*v=/, '').replace(/\?.*/, '').replace(/\&.*/,'');

    debug("Saving entry (video: %s) user %s tag: %s file %s (%d bytes)",
        isVideo ? video.videoId : "false", supporter.p,
        supporter.tag ? supporter.tag.name : "<none>",
        fdest, _.size(body.element)
    );

    return mongo
        .writeOne(nconf.get('schema').videos, video)
        .then(function() {
            return fs
                .writeFileAsync(fdest, body.element)
                .return(true);
        })
        .catch(function(error) {
            debug("Error: %s", error);
            return false;
        });
};


var last = null;
function getMirror(req) {

    if(!security.checkPassword(req))
        return security.authError;

    if(last) {
        let retval = Object(last);
        last = null;
        debug("getMirror: authentication successfull, %d elements in volatile memory",
            _.size(retval) );
        return { json: { content: retval, elements: _.size(retval) }};
    } else
        debug("getMirror: auth OK, but nothing to be returned");

    return { json: { content: null } };
}
function appendLast(req) {
    /* this is used by getMirror, to mirror what the server is getting
     * used by developers with password,
     ---- TODO should be personalized and logged */
    const MAX_STORED_CONTENT = 10;
    if(!last) last = [];
    if(_.size(last) > MAX_STORED_CONTENT) 
        last = _.tail(last);

    last.push(_.pick(req, ['headers', 'body']));
};

function headerError(headers) {
    debug("Error detected: %s", headers.error);
    return { 'json': {
        'status': 'error',
        'info': headers.error
    }};
}

async function processEvents2(req) {

    const headers = processHeaders(_.get(req, 'headers'), hdrs);

    if(headers.error)
        return headerError(headers);

    if (!utils.verifyRequestSignature(req)) {
        debug("Verification fail (signature %s)", headers.signature);
        return { json: {
            status: 'error',
            info: 'Signature does not match request body' }};
    }

    const supporter = await automo.tofu(headers.publickey, headers.version);

    // this is necessary for the mirror functionality
    appendLast(req);

    const htmls = _.map(req.body, function(body, i) {
        const id = utils.hash({
            publicKey: headers.publickey,
            size: _.size(body.element),
            randomUUID: body.randomUUID,
            i,
        });
        const isVideo = body.href.match(/v=/) ? true : false;
        const html = {
            id,
            href: body.href,
            publicKey: headers.publickey,
            randomUUID: body.randomUUID,
            clientTime: new Date(body.clientTime),
            savingTime: new Date(),
            html: body.element,
            size: _.size(body.element),
            isVideo,
            selector: body.selector,
            incremental: body.incremental,
            packet: i,
        }
        return html;
    });

    const check = await automo.write(nconf.get('schema').htmls, htmls);
    if(check.error) {
        debug("Error in saving %d htmls? %j", _.size(htmls), check);
        return { json: {status: "error", info: check.info }};
    }

    const info = _.map(htmls, function(e) {
        return [ e.packet, e.size, e.selector ];
    })
    debug("%s: %s", supporter.p, JSON.stringify(info));

    /* this is what returns to the web-extension */
    return { json: {
        status: "OK",
        supporter: supporter,
        results: check
    }};
};

function processEvents(req) {

    var headers = processHeaders(_.get(req, 'headers'), hdrs);

    if(headers.error)
        return headerError(headers);

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

            return mongo.updateOne(nconf.get('schema').supporters, {
                publicKey: supporter.publicKey
            }, supporter);
        })
        .tap(function(supporter) {
            /* directory check */
            var ddest = path.join( nconf.get('storage'), moment().format("YYYY-MM-DD"));
            return fs
                .mkdirAsync(ddest).catch(function(e) { });
        })
        .then(function(supporter) {
            // this is necessary for the mirror functionality
            appendLast(req);

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
    processEvents2,
    saveVideo,
    getMirror,
    hdrs: hdrs,
    processHeaders: processHeaders,
    TOFU: TOFU
};
