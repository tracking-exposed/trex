const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('routes:personal');
const nconf = require('nconf');

const automo = require('../lib/automo');
const params = require('../lib/params');
const CSV = require('../lib/CSV');
const mongo3 = require('../lib/mongo3');

const SEARCH_FIELDS = require('./public').SEARCH_FIELDS;

async function getPersonal(req) {
    // personal API format is
    // /api/v1/personal/:publicKey/:what/:format
    const k =  req.params.publicKey;
    if(_.size(k) < 26)
        return { json: {
            message: "Invalid publicKey",
            error: true
        }};
    const amount = _.parseInt(req.query.amount) || 50;
    const skip = _.parseInt(req.query.skip) || 0;

    const what = req.params.what;
    const format = req.params.format;
    const allowed = ['summary', 'search', 'foryou'];

    if(allowed.indexOf(what) === -1) {
        return { json: {
            what,
            allowed,
            error: true,
            details: "Invalid parameter"
        }};
    }

    debug("Asked to get data kind %s, format %s", what, format);
    let retval = null;
    try {
        if(what === 'summary')
            retval = await automo.getSummaryByPublicKey(k);
        else if(what === 'search') {
            const avail = await automo.getMetadataByFilter({type: 'search', publicKey: k}, { amount, skip});
            retval = _.map(avail, function(o) {
                return _.pick(o, SEARCH_FIELDS);
            });
        }
        else if(what === 'foryou')
            retval = await automo.getMetadataByFilter({type: 'foryou', publicKey: k}, { amount, skip});

        debug("Personal %s returning %d objects", what, retval.length);
    } catch(error) {
        const message = error instanceof Error ? error.message : 'unknown error';
        debug("%s", message);
        return { json: { error: true, message }};
    }

    return { json: retval };
};

/*
async function getPersonalCSV(req) {
    const CSV_MAX_SIZE = 1000;
    const k =  req.params.publicKey;
    const data = await automo.getMetadataByFilter({ publicKey: k, type: 'home'}, { amount: CSV_MAX_SIZE, skip: 0 });
    // get metadata by filter actually return metadata object so we need unnesting
    const unrolledData = _.reduce(data, unNestHome, []);
    const csv = CSV.produceCSVv1(unrolledData);

    debug("getPersonalCSV produced %d bytes from %d homepages (max %d)",
        _.size(csv), _.size(data), CSV_MAX_SIZE);
    if(!_.size(csv))
        return { text: "Data not found: are you sure you've any pornhub homepage acquired?" };

    const filename = 'potrex-homepages-' + moment().format("YY-MM-DD") + ".csv"
    return {
        headers: {
            "Content-Type": "csv/text",
            "Content-Disposition": "attachment; filename=" + filename
        },
        text: csv,
    };
};
*/

/*
async function removeEvidence(req) {
    const k =  req.params.publicKey;
    if(_.size(k) < 26)
        return { json: { "message": "Invalid publicKey", "error": true }};

    const id = req.params.id;
    const result = await automo.deleteEntry(k, id);
    debug("Requeste delete of metadataId %s deleted %d video and %d metadata",
        id, _.size(result.videoId), _.size(result.metadata));
    return { json: { success: true, result }};
};
*/

module.exports = {
    getPersonal,
};
