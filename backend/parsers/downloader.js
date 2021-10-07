const _ = require('lodash');
const nconf = require('nconf');
const debug = require('debug')('parsers:downloader');
const fetch = require('node-fetch');

const mongo3 = require('../lib/mongo3');


async function checkDuplicates(mongoc, listof, dbColumn) {
    const unexistent = [];
    for (const t of listof) {
        const exists = await mongo3.count(mongoc, dbColumn, { videoId: t.videoId });
        if(exists == 0)
            unexistent.push(t);
    }
    if(_.size(unexistent))
        debug("Returning %d newly seen videoId to be downloaded", _.size(unexistent));
    return unexistent;
}

async function downloader(envelop, previous) {

    if(previous.nature.type !== 'home') return false;

    /* calculate how many potential vids should be fetched */
    const videos = _.flatten(_.map(_.get(previous, 'home.sections', []), 'videos'));
    const potential = _.map(_.filter(videos, 'href'), function(v) {
        return {
            url: 'http://www.pornhub.com' + v.href,
            when: new Date(),
            videoId: v.videoId
        };
    });

    const mongoc = await mongo3.clientConnect({concurrency: 1});
    /* check in the DB if the ID exists */
    const downloadablev = await checkDuplicates(mongoc, 
        potential, nconf.get('schema').retrieved);

    const fetched = await fetchHTMLs(mongoc,
        downloadablev, nconf.get('schema').retrieved);

    await mongoc.close();
    return fetched;
}

async function fetchHTMLs(mongoc, listof, dbColumn) {
    const fetchedId = [];
    for (const d of listof) {
        debug("Connecting to fetch: %s", d.url);
        let response = await fetch(d.url);
        if(response.status !== 200) {
            debug("Error in %s: %s", d.url, response.statusText);
        } else {
            d.html = await response.text();
            await mongo3.upsertOne(mongoc, dbColumn, {videoId: d.videoId}, d);
            fetchedId.push(d.videoId);
        }
    }
    return fetchedId;
}

module.exports = downloader;