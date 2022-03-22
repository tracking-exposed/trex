import { geo } from '@shared/utils/ip.utils';

const _ = require('lodash');
const debug = require('debug')('routes:events');
const nconf = require('nconf');

const { chiaroScuro, comparison } = require('./directives');
const automo = require('../lib/automo');
const utils = require('../lib/utils');
const security = require('../lib/security');

function processHeaders(received, required) {
    const ret = {};
    const errs = _.compact(_.map(required, function(destkey, headerName) {
        const r = _.get(received, headerName);
        if(_.isUndefined(r))
            return headerName;

        _.set(ret, destkey, r);
        return null;
    }));
    if(_.size(errs)) {
        debug("Error in processHeaders, missing: %j", errs);
        return { 'errors': errs };
    }
    return ret;
};

let last = null;
function getMirror(req) {

    if(!security.checkPassword(req))
        return security.authError;

    if(last) {
        const retval = Object(last);
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

const EXPECTED_HDRS =  {
    'content-length': 'length',
    'x-yttrex-version': 'version',
    'x-yttrex-publickey': 'publickey',
    'x-yttrex-signature': 'signature',
    'accept-language': 'language',
};

function extendIfExperiment(expinfo, listOf) {

    if(!expinfo)
        return listOf;
    debug("Linking %d objects to experiment %s (%s)",
        listOf.length, expinfo.experimentId,
        expinfo.directive[0].directiveType);

    const nothelpf = ['_id', 'publicKey',
        'directive', 'href', 'status'];

    return _.map(listOf, function(o) {
        /* this function link the experiment object to the
           element found, and then rebuild the directives to
           check if the URL belong or not to the plans.
           If is does, it save it, otherwise, is activity
           made by the browser outside the directives is causes
           o.belonginn = false; */
        o.experiment = _.omit(expinfo, nothelpf);
        o.experiment.directiveType = expinfo.directive[0].directiveType;
        const directives = (o.experiment.directiveType === 'comparison') ?
            _.map(expinfo.directive[0].links, comparison) :
            _.flatten(_.map(expinfo.directive[0].links,  chiaroScuro));
        o.experiment.directiveN = _.reduce(directives, function(memo, d, cnt) {
            if(_.isInteger(memo))
                return memo;
            return d.url === o.href.replace(/\+/, '%20') ? cnt : memo;
        }, NaN);
        o.experiment.directive = _.isNaN(o.experiment.directiveN) ?
            null : _.nth(directives, o.experiment.directiveN);
        o.experiment.belonging = !_.isNaN(o.experiment.directiveN);
        o.experiment.directives = directives;
        return o;
    });
}

async function saveInDB(experinfo, objects, dbcollection) {

    if(!objects.length)
        return { error: null, message: "no data", subject: dbcollection};

    // this function saves leafs and htmls, and extend with exp
    const expanded = extendIfExperiment(experinfo, objects);

    try {
        await automo.write(dbcollection, expanded);
        debug("Saved %d %s metadataId %j",
            objects.length, dbcollection,
            _.uniq(_.map(objects, 'metadataId')));
        return {
            error: false, success: objects.length,
            subject: dbcollection
        };

    } catch(error) {
        debug("Error in saving %d %s %j", objects.length, dbcollection, error.message);
        return { error: true, message: error.message };
    }
}

async function processEvents2(req) {

    const headers = processHeaders(req.headers, EXPECTED_HDRS);
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

    // this information would be merged in htmls and leafs if exist
    const experinfo = await automo.pullExperimentInfo(supporter.publicKey);
    // experinfo is an aggregation from collection 'experiments' and
    // collection 'directives'

    const blang = headers.language.replace(/;.*/, '').replace(/,.*/, '');
    // debug("CHECK: %s <%s>", blang, headers.language );
    const htmls = _.map(
        _.reject(_.reject(req.body, { type: 'leaf'}), { type: 'info'}),
        /* once the version 1.8.x would be in production we might gradually
         * get rid of these filters, the issue was the presence of 'info' entry
         * fail in extracting a size and more likely a collision was happening */
        function(body, i) {

        const nature = utils.getNatureFromURL(body.href);
        const metadataId = utils.hash({
            publicKey: headers.publickey,
            randomUUID: body.randomUUID,
            href: body.href,
        });
        const id = utils.hash({
            metadataId,
            size: body.element.length,
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
            counters: [body.incremental, i],
            nature,
            geoip: geo(headers['x-forwarded-for'] || req.socket.remoteAddress),
        }
        return html;
    });

    const leaves = _.map(_.filter(req.body, { type: 'leaf'}), function(e, i) {
        const nature = utils.getNatureFromURL(e.href);
        const metadataId = utils.hash({
            publicKey: headers.publickey,
            randomUUID: e.randomUUID,
            href: e.href,
        });
        const id = utils.hash({
            metadataId,
            contentHash: e.hash,
            i
        });
        return {
            id,
            metadataId,
            blang,
            publicKey: headers.publickey,
            ..._.omit(e, ['type', 'incremental', 'randomUUID', 'hash', 'clientTime']),
            nature,
            savingTime: new Date(),
        }
    });

    /* after having prepared the objects, the functions below would:
      1) extend with experiment if is not null
      2) save it in the DB and return information on the saved objects */
    const htmlrv = await saveInDB(experinfo, htmls, nconf.get('schema').htmls);
    const leafrv = await saveInDB(experinfo, leaves, nconf.get('schema').leaves);

    /* this is what returns to the web-extension */
    return { json: {
        status: "OK",
        supporter,
        leaves: leafrv,
        htmls: htmlrv,
    }};
};


module.exports = {
    processEvents2,
    getMirror,
    EXPECTED_HDRS,
    processHeaders,
};
