const _ = require('lodash');
const debug = require('debug')('routes:research');

const automo = require('../lib/automo');
const CSV = require('../lib/CSV');
const { flattenSearch } = require('./search');

/* this route have been developed to support researcher 
 * it is meant for people knowing a list of publicKeys
 * and emulate the API  yttrex/experiment/:id/:what/csv
 * and returns for every metadata queries an entry per video.  */
async function getResearcherData(req) {
    // expected input variables :publicKeyList :what
    const what = req.params.what;
    const researcherAmount = { amount: 3000, skip: 0};
    const pubkeys = req.params.publicKeyList.split(',');
    if(_.filter(_.map(pubkeys, function(k) {
        console.log(k.length, k);
        return k.length < 26;
    })).length)
        return { text: 'Invalid key lenght supply among the list'};

    debug("PublicKeys validated %d, subject %s", pubkeys.length, what)

    let metadata = [];
    if(what === 'search') {
        for (const k of pubkeys) {
            const found = await automo.getMetadataByFilter({
                type: 'search', publicKey: k
            }, researcherAmount);
            const unrolledData = _.reduce(found, flattenSearch, []);
            metadata = _.concat(metadata, unrolledData);
            debug("with publicKey %s accumulated search results %d",
                k, metadata.length);
        }
    }
    else if(what === 'foryou' || what === 'following') {
        return { text: 'not yet implemented!' };
    } else {
        debug("Invalid subject (%s) requested", what);
        return { text: 'Invalid subject requested (foryou|following|search)' };
    }

    const csv = CSV.produceCSVv1(metadata);
    if(!_.size(csv))
        return { text: "Error: no CSV generated 🤷" };

    const filename = 'searchfrom-' + pubkeys.length + '-' + metadata.length + '.csv';
    return {
        headers: {
            "Content-Type": "csv/text",
            "Content-Disposition": "attachment; filename=" + filename
        },
        text: csv,
    };
}

module.exports = {
    getResearcherData,
};
