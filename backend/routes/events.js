const _ = require('lodash');
const debug = require('debug')('lib:events');
const nconf = require('nconf');

const automo = require('../lib/automo');
const mongo = require('../lib/mongo');
const utils = require('../lib/utils');
const security = require('../lib/security');

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
        const metadataId = utils.hash({
            publicKey: headers.publickey,
            randomUUID: body.randomUUID,
        });
        const html = {
            id,
            metadataId,
            href: body.href,
            publicKey: headers.publickey,
            clientTime: new Date(body.clientTime),
            savingTime: new Date(),
            html: body.element,
            size: _.size(body.element),
            selector: body.selector,
            incremental: body.incremental,
            packet: i,
        }
        return html;
    });

    const check = await automo.write(nconf.get('schema').htmls, htmls);
    if(check && check.error) {
        debug("Error in saving %d htmls %j", _.size(htmls), check);
        return { json: {status: "error", info: check.info }};
    }

    const info = _.map(htmls, function(e) {
        return [ e.packet, e.size, e.selector ];
    });
    debug("%s <- %s", supporter.p, JSON.stringify(info));

    /* this is what returns to the web-extension */
    return { json: {
        status: "OK",
        supporter: supporter,
        results: check
    }};
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
    processEvents2,
    getMirror,
    hdrs: hdrs,
    processHeaders: processHeaders,
    TOFU: TOFU
};
