#!/usr/bin/env node
const _ = require('lodash');
const debug = require('debug')('emergency-script:2:submitRecommendations');
const nconf = require('nconf');
const fetch = require('node-fetch');

nconf.argv().env().file('config/settings.json');

const accessToken = nconf.get('accessToken');
const backend = nconf.get('backend') || 'https://youchoose.tracking.exposed';

async function repullVideo(accessToken) {

    const ogpAPIurl = backend + "/api/v3/creator/videos/repull";
    const response = await fetch(ogpAPIurl, {
        method: 'post',
        headers: {
            'Content-Type': 'application/json',
            'x-authorization': accessToken,
        }
    });
    const answer = await response.json();
    if(answer.error) {
        // eslint-disable-next-line no-console
        console.log("Error in", ogpAPIurl, "\n", JSON.stringify(answer));
    } else {
        debug("[OK] %j", answer);
    }
}

try {
    if(!accessToken) {
        // eslint-disable-next-line no-console
        return console.log("--accessToken is mandatory");
    }
    if(_.endsWith(backend, '/')) {
        // eslint-disable-next-line no-console
        return console.log("--backend should not end with a '/' ");
    }

    debug("Repulling videos in server %s", backend);
    repullVideo(accessToken);
} catch(error) {
    // eslint-disable-next-line no-console
    console.log(error);
}
