#!/usr/bin/env node
const _ = require('lodash');
const debug = require('debug')('yttrex:mirrorer');
const nconf = require('nconf');
const fetch = require('node-fetch');

nconf.argv().env();

if(!nconf.get('key'))
    return console.log("--key required");

const source = nconf.get('source') || 'https://youtube.tracking.exposed';
const sourceUrl = `${source}/api/v1/mirror/${nconf.get('key')}/`;
const dest = nconf.get('dest') || 'http://localhost:9000';
const destUrl = `${dest}/api/v2/events`;

debug("Fetching latest samples via %s", sourceUrl);

async function main() {
    const result = await fetch(sourceUrl);
    const body = await result.json();

    if(!body.elements) {
        // body contains { content: [Object(s)], elements: <Int> }
        debug("No elements available from the server...");
        return;
    }

    // body.content[0...] = { body: {}, headers: {} }
    for(const copiedReq of body.content) {
        debug("%s — %s",
            copiedReq.headers['x-yttrex-version'],
            _.map(copiedReq.body, 'href').join(', ') );
        const r = await fetch(destUrl, {
            method: 'POST',
            headers: copiedReq.headers,
            body: JSON.stringify(copiedReq.body),
        })
        const result = await r.json();
        debug(_.pick(result, ['htmls', 'leafs', 'supporter.p']));
    }
}

try {
    main();
} catch(error) {
    console.log(error);
}

        /*
            .then(function(result) {
                if(result.body && result.body.supporter)
                    debug("OK %s: %s",
                        copiedReq.headers['x-yttrex-version'], result.body.supporter.p);
                else
                    debug("?? %s - %j",
                        copiedReq.headers['x-yttrex-version'], result.body);
                        */
