#!/usr/bin/env node
const _ = require('lodash');
const debug = require('debug')('bin:picker');
const Promise = require('bluebird');
const request = Promise.promisifyAll(require('request'));
const nconf = require('nconf');

const mongo3 = require('../lib/mongo3');

nconf.argv().env().file({ file: 'config/settings.json' });

const source = nconf.get('source') || 'https://youtube.tracking.exposed';

async function fetchRemote(sourceUrl) {
    return request
        .getAsync({url: sourceUrl, rejectUnauthorized: false } )
        .then(function(res) {
            debug("Download completed (%d)", _.size(res.body) );
            return res.body;
        })
        .then(JSON.parse)
        .catch(function(error) {
            debug("――― [E] %s", error.message);
            return [];
        });
}

async function main(metadataId) {
    const sourceUrl = `${source}/api/v2/html/${metadataId}`;
    debug("Fetching evidence via %s", sourceUrl);
    const htmls = await fetchRemote(sourceUrl);

    if(!_.size(htmls)) {
        debug("No htmls received");
        return null;
    }
    debug("%d htmls object match the metadataId", _.size(htmls));

    const mongoc = await mongo3.clientConnect({concurrency: 1});
    for (const html of htmls) {
        _.unset(html, 'processed');
        _.unset(html, '_id');

        try {
            await mongo3.writeOne(mongoc, nconf.get('schema').htmls, html);
            debug("Imported html %d %s", html.size, html.tag ? "(" + html.tag + ")" : "" );
        } catch(e) {
            debug("Error in importing HTML: %s", e.message);
        }
    }
    await mongoc.close();
    debug("Import complete! %d", _.size(htmls));
    return _.size(htmls);
}

if(!nconf.get('id'))
    return console.log("--id required (should be a metadataId)");


try {
    main(nconf.get('id'));
} catch (e) {
    debug("Unmanaged error: %s", e.message);
}
