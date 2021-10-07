const _ = require('lodash');
const debug = require('debug')('lib:parserchain');
const nconf = require('nconf'); 
const JSDOM = require('jsdom').JSDOM;

const utils = require('./utils');
const mongo3 = require('./mongo3');

module.exports = {
    /* this sequence is executed in this order.
     * after the newline there are modules that levegared on previously mined metadata */
    dissectorList: [
        'nature',
        'advertising',
        'home',
        'video',
        'search',
        'related',
        'downloader',
        'categorizer'
    ],
    nature: require('../parsers/nature'),
    advertising: require('../parsers/advertising'),
    home: require('../parsers/home'),
    video: require('../parsers/video'),
    search: require('../parsers/search'),
    related: require('../parsers/related'),
    downloader: require('../parsers/downloader'),
    categorizer: require('../parsers/categorizer'),

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
    let metadata = null;

    if(entry.findings.nature.type == 'home') {
        metadata = _.merge(
            _.pick(entry.source.html, [ 'href', 'profileStory', 'publicKey']),
            entry.findings.advertising,
            entry.findings.home,
            entry.findings.nature
        );
    }
    else if(entry.findings.nature.type == 'search') {
        metadata = _.merge(
            _.pick(entry.source.html, [ 'href', 'profileStory', 'publicKey']),
            entry.findings.advertising,
            entry.findings.search,
            entry.findings.params,
            entry.findings.related,
            entry.findings.nature
        );
    }
    else if(entry.findings.nature.type == 'video') {
        metadata = _.merge(
            _.pick(entry.source.html, [ 'href', 'profileStory', 'publicKey']),
            entry.findings.advertising,
            entry.findings.video,
            entry.findings.nature
        );
    }
    else return null; // 'video' 'pornstar' etc.. are discharged now.

    metadata.savingTime = new Date(entry.source.html.savingTime);
    metadata.clientTime = new Date(entry.source.html.clientTime);
    metadata.id = entry.source.html.metadataId;
    metadata.htmlId = entry.source.html.id;
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
        let retval = await dissectorF(source, envelope.findings);
        let resultIndicator = JSON.stringify(retval).length;
        _.set(envelope.log, dissectorName, resultIndicator);
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
    return [ r.result.ok, u.result.ok ];
}
