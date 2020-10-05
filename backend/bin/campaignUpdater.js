#!/usr/bin/env node
var _ = require('lodash');
var debug = require('debug')('bin:campaignUpdater');
var request = require('request');
var fs = require('fs');
var nconf = require('nconf');

nconf.argv().env();

if(!nconf.get('key'))
    return console.log("--key required (other allowed params --source <jsonFile> default config/campaigns.json, and --dest <host>, default localhost:9000)");

async function main() {

    const sourcefile = nconf.get('source') || 'config/campaigns.json';
    const dest = nconf.get('dest') || 'http://localhost:9000';
    const destUrl = `${dest}/api/v2/campaigns/${nconf.get('key')}/`;

    const content = JSON.parse(fs.readFileSync(sourcefile));
    debug("Read file %s found %d campaigns (%j)", sourcefile, 
        _.size(content), _.map(content, 'name'));
    const answer = await request.post(destUrl, { json: content });
    console.log("Updating", destUrl);

    return answer;
}

main();