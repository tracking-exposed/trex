const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('routes:personal');
const nconf = require('nconf');

const automo = require('../lib/automo');
const params = require('../lib/params');
const CSV = require('../lib/CSV');
const mongo3 = require('../lib/mongo3');

// personal API format is
// /api/v1/personal/:publicKey/:what/:format

async function getPersonal(req) {
    const k =  req.params.publicKey;
    if(_.size(k) < 26)
        return { json: {
            message: "Invalid publicKey",
            error: true
        }};

    const what = req.params.what;
    const format = req.params.format;
    // TODO expand if the personal page needs more views
    const allowed = ['summary'];

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
    if(what === 'summary')
        retval = await automo.getSummaryByPublicKey(k, what);

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
