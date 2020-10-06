#!/usr/bin/env node
var _ = require('lodash');
var debug = require('debug')('bin:campaignUpdater');
var request = require('request');
var fs = require('fs');
var nconf = require('nconf');
var process = require('process');

nconf.argv().env();

if(!nconf.get('key'))
    return console.log("--key required (other allowed params --source <jsonFile> default config/campaigns.json, and --dest <host>, default localhost:9000)");

async function main() {

    console.log("Remember: security downgrade in campaignUpdater.js");
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;

    const sourcefile = nconf.get('source') || 'config/campaigns.json';
    const dest = nconf.get('dest') || 'http://localhost:9000';
    const destUrl = `${dest}/api/v2/campaigns/${nconf.get('key')}/`;

    const content = JSON.parse(fs.readFileSync(sourcefile));
    debug("Read file %s found %d campaigns (%j) connecting to %s",
        sourcefile, _.size(content), _.map(content, 'name'), destUrl);
    await request.post(destUrl, { json: content }, function(request, response) {
        const answer = response.toJSON();
        debug("Update completed, server said: %s", JSON.stringify(answer.body, undefined, 2));
        console.log(`Test by connecting to ${dest}/api/v2/queries/<campaignName>`);
    });
}

main();