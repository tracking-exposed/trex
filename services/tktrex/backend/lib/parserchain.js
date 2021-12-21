const _ = require('lodash');
const debug = require('debug')('lib:parserchain');
const nconf = require('nconf'); 
const JSDOM = require('jsdom').JSDOM;

const mongo3 = require('./mongo3');

const parserList = {
    nature: require('../parsers/nature'),
    description: require('../parsers/description'),
    music: require('../parsers/music'),
    hashtags: require('../parsers/hashtags'),
    numbers: require('../parsers/numbers'),
    stitch: require('../parsers/stitch'),
    author: require('../parsers/author'),
    search: require('../parsers/search'),
    downloader: require('../parsers/downloader'),
};

module.exports = {
    /* this sequence is executed in this order.
     * after the newline there are modules that levegared on previously mined metadata */
    dissectorList: parserList,

    // functions
    initializeMongo,
    getLastHTMLs,
    wrapDissector,
    updateMetadataAndMarkHTML,
    buildMetadata,
};

function buildMetadata(entry) {
    // this contains the original .source (html, impression, timeline), the .findings and .failures 
    // the metadata is aggregated by unit and not unrolled in any way
    const metadata = {
        ...entry.findings.nature,
        ...entry.findings.description,
        ...entry.findings.music,
        ...entry.findings.hashtags,
        ...entry.findings.numbers,
        ...entry.findings.stitch,
        ...entry.findings.author,
        ...entry.findings.downloader,
    };

    metadata.savingTime = new Date(entry.source.html.savingTime);
    metadata.id = entry.source.html.id;
    metadata.publicKey = entry.source.html.publicKey;
    metadata.timelineId = entry.source.html.timelineId;
    metadata.order = entry.source.html.n[0];
    // from routes/events.js the 0 is videoCounter, client side
    return metadata;
}

const mongodrivers = {
    readc: null,
    writec: null,
};

async function initializeMongo(amount) {
    mongodrivers.readc = await mongo3.clientConnect({concurrency: 1});
    mongodrivers.writec = await mongo3.clientConnect({concurrency: amount});
}

async function getLastHTMLs(filter, amount) {

    if(!mongodrivers.readc)
        await initializeMongo(amount);

    const htmls = await mongo3.aggregate(mongodrivers.readc,
        nconf.get('schema').htmls, [ 
            { $match: filter },
            { $sort: { "savingTime": 1 } },
            { $limit: amount },
            { $lookup: { from: 'supporters', localField: 'publicKey', foreignField: 'publicKey', as: 'supporter'} },
        ]);

    let errors = 0;
    const formatted = _.map(htmls, function(h) {
        try {
            return {
                supporter: _.first(h.supporter),
                jsdom: new JSDOM(h.html.replace(/\n\ +/g, '')).window.document,
                html: _.omit(h, [ 'supporter' ])
            };
        }
        catch(error) {
            errors++;
            debug("Error when formatting HTML: %s, htmlId %s", error.message, h.id);
        }
    });

    return {
        overflow: _.size(htmls) == amount,
        sources: _.compact(formatted),
        errors,
    }
}

async function wrapDissector(dissectorF, dissectorName, source, envelope) {
    try {
        // this function pointer point to all the functions in parsers/*
        // as argument they take function(source ({.jsdom, .html}, previous {...}))
        const retval = await dissectorF(source, envelope.findings);

        if(_.isUndefined(retval) || _.isNull(retval) || retval === false)
            envelope.log[dissectorName] = "∅";
        else
            envelope.log[dissectorName] = JSON.stringify(retval).length;

        return retval;
    } catch(error) {
        debug("Error in %s: %s %s", dissectorName, error.message, error.stack);
        _.set(envelope.log, dissectorName, "!E");
        throw error;
    }
}

async function updateMetadataAndMarkHTML(e) {
    if(!e) return null;
    let r = await mongo3.upsertOne(mongodrivers.writec, nconf.get('schema').metadata, { id: e.id }, e);
    let u = await mongo3.updateOne(mongodrivers.writec, nconf.get('schema').htmls, { id: e.id }, { processed: true });
    return [ r.modifiedCount, u.modifiedCount ];
}
