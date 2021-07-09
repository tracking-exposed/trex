#!/usr/bin/env node
var _ = require('lodash');
var debug = require('debug')('bin:guardoniUpdater');
var request = require('request');
var fs = require('fs');
var nconf = require('nconf');
const path = require('path');

nconf.argv().env();

if(!nconf.get('source')) {
    return console.log("--source it is mandatory and filename must be $experimentName__$botname.txt and be a list of URLs")
}

async function main() {

    const sourcefile = nconf.get('source');
    const dest = (nconf.get('remote')) ? 'https://youtube.tracking.exposed' : 'http://localhost:9000';
    const basename = path.basename(sourcefile);
    const experiment = basename.split("__")[0];
    const botname = (basename.split("__")[1]).replace(/\..*/, "");
    debug("expriment %s botname", experiment, botname);
    const destUrl = `${dest}/api/v2/guardoni/${experiment}/${botname}`;

    const urls = fs.readFileSync(sourcefile, 'utf-8').split('\n');
    debug("Read file %s found %d urls for experiment %s and bot %s post to %s",
        sourcefile, _.size(urls), experiment, botname, destUrl);

    const content = {
        experiment,
        botname,
        urls
    };
    await request.post(destUrl, { json: content }, function(request, response) {
        const answer = response.toJSON();
        console.log(`Done! Server said: ${JSON.stringify(answer.body, undefined, 2)}`);
        console.log(`Test by connecting to ${destUrl}`);
    });
}

main();