#!/usr/bin/env node
var _ = require('lodash');
var debug = require('debug')('bin:campaignUpdater');
var request = require('request');
var fs = require('fs');
var nconf = require('nconf');

nconf.argv().env();

if(!nconf.get('key'))
    return console.log("--key required (other allowed params --source <jsonFile> default config/campaigns.json, and --remote (bool), default localhost:9000)");

async function main() {

    const sourcefile = nconf.get('source') || 'config/campaigns.json';
    const dest = (nconf.get('remote')) ? 'https://youtube.tracking.exposed' : 'http://localhost:9000';
    const destUrl = `${dest}/api/v2/campaigns/${nconf.get('key')}/`;

    const content = JSON.parse(fs.readFileSync(sourcefile));
    debug("Read file %s found %d campaigns (%j) connecting to %s",
        sourcefile, _.size(content), _.map(content, 'name'), destUrl);
    await request.post(destUrl, { json: content }, function(request, response) {
        const answer = response.toJSON();
        console.log(`Done! Server said: ${JSON.stringify(answer.body, undefined, 2)}`);
        console.log(`Test by connecting to ${dest}/api/v2/queries/<campaignName>`);
    });
}

main();