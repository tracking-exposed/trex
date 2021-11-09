#!/usr/bin/env node
const _ = require('lodash');
const debug = require('debug')('emergency-script:2:submitRecommendations');
const nconf = require('nconf');
const fetch = require('node-fetch');

nconf.argv().env().file('config/settings.json');

const accessToken = nconf.get('accessToken');
const urls = nconf.get('urls');
const backend = nconf.get('backend') || 'https://youchoose.tracking.exposed';
const targetVideoId = nconf.get('targetVideoId');


// https://github.com/tracking-exposed/YCAI/issues/65
// [2/3 support script] - configure to backend API a list of recommendations
async function submitRecommendations(accessToken, urls) {
    const urlist = urls.split(',');
    debug("depacked url list in %d urls", urlist.length);

    const ogpAPIurl = backend + "/api/v3/creator/ogp";
    const urlIds = [];
    for (const url of urlist) {
        const response = await fetch(ogpAPIurl, {
            method: 'post',
            body: JSON.stringify({url}),
            headers: {
                'Content-Type': 'application/json',
                'x-authorization': accessToken,
            }
        });
        const answer = await response.json();
        if(answer.error) {
            console.log("Error in", url);
            console.log("<E>", JSON.stringify(answer));
        } else {
            debug("[OK] %s %j", url, answer);
            urlIds.push(answer.urlId);
        }
    }

    const updvidrecAPIurl = backend + "/api/v3/creator/updateVideo";
    const response = await fetch(updvidrecAPIurl, {
        method: 'post',
        body: JSON.stringify({
            videoId: targetVideoId,
            recommendations: urlIds
        }),
        headers: {
            'Content-Type': 'application/json',
            'x-authorization': accessToken,
        }
    });
    const answer = await response.json();
    if(answer.error) {
        debug("Error: %o:", answer);
	process.exit(1);
    }
    else
        debug("Successfully expanded recommendations: %o: testing now", answer);

    const testAPIurl = backend + "/api/v3/creator/recommendations";
    const check = await fetch(testAPIurl, {
        method: 'get',
        headers: {
            'x-authorization': accessToken,
        }
    })
    const conclusion = await check.json();
    debug("Result from API: %o", conclusion);

    const externalook = backend + "/api/v3/video/" + targetVideoId + "/recommendations";
    const client = await fetch(externalook);
    const forpeoples = await client.json();
    debug("Result for people is %o", forpeoples);
}

try {
    if(!accessToken)
        return console.log("--accessToken is mandatory");
    if(!urls)
        return console.log("--urls https://url.position.1,https://url.position.2");
    if(_.endsWith(backend, '/'))
        return console.log("--backend should not end with a '/' ");
    if(!targetVideoId)
	return console.log("--targetVideoId is mandatory");

    debug("Submitting recommendations to server %s", backend);
    submitRecommendations(accessToken, urls);
} catch(error) {
    console.log(error);
}
