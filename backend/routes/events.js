const _ = require('lodash');
const debug = require('debug')('routes:events');
const nconf = require('nconf');

const automo = require('../lib/automo');
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
     * used by developers with password */
    const MAX_STORED_CONTENT = 13;
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

    const blang = headers.language.replace(/;.*/, '').replace(/,.*/, '');
    // debug("CHECK: %s <%s>", blang, headers.language );
    const htmls = _.map(req.body, function(body, i) {
        const nature = utils.getNatureFromURL(body.href);
        const metadataId = utils.hash({
            publicKey: headers.publickey,
            randomUUID: body.randomUUID,
            href: body.href,
        });
        const id = utils.hash({
            metadataId,
            size: _.size(body.element),
            contenthash: body.contenthash,
            href: body.href,
            i,
        });
        const html = {
            id,
            metadataId,
            blang,
            href: body.href,
            publicKey: headers.publickey,
            clientTime: new Date(body.clientTime),
            savingTime: new Date(),
            html: body.element,
            size: _.size(JSON.stringify(body.element)),
            selector: body.selector,
            incremental: body.incremental,
            type: body.type,
            packet: i,
            nature,
        }
        return html;
    });

    const experinfo = await automo.pullExperimentInfo(supporter.publicKey);
    const htmlexpstended = utils.extendIfExperiment(experinfo, htmls);
    if(htmlexpstended.length) {
        const check = await automo.write(nconf.get('schema').htmls, htmlexpstended);
        if(check && check.error) {
            debug("Error in saving %d htmls %j", _.size(htmls), check);
            return { json: {status: "error", info: check.info }};
        }
        debug("Saved %d htmls metadataId: %j", htmlexpstended.length, _.uniq(_.map(htmlexpstended, 'metadataId')));
    }
 
    const labels = _.map(_.filter(htmls, { type: 'info'}), function(e) {
        e.acquired = e.html.acquired;
        e.selectorName = e.html.name;
        e.contenthash = e.contenthash;
        debug(_.keys(e));
        _.unset(e, 'html');
        return e;
    });
    const enhanced = utils.extendIfExperiment(experinfo, labels);
    if(enhanced.length) {
        const check = await automo.write(nconf.get('schema').labels, enhanced);
        if(check && check.error) {
            debug("Error in saving %d labels %j", _.size(labels), check);
            return { json: {status: "error", info: check.info }};
        }
        debug("Saved %d labels metadataId: %j", labels.length, _.uniq(_.map(labels, 'metadataId')));
    }

    /* this is what returns to the web-extension */
    return { json: {
        status: "OK",
        supporter,
        labels: _.size(enhanced),
        htmls: _.size(htmlexpstended),
    }};
};

const hdrs =  {
    'content-length': 'length',
    'x-yttrex-build': 'build',
    'x-yttrex-version': 'version',
    'x-yttrex-nonauthcookieid': 'supporterId',
    'x-yttrex-publickey': 'publickey',
    'x-yttrex-signature': 'signature',
    'accept-language': 'language',
};

module.exports = {
    processEvents2,
    getMirror,
    hdrs,
    processHeaders,
};
