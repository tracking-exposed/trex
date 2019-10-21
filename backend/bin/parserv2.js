#!/usr/bin/env node
const Promise = require('bluebird');
const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('bin:parse2');
const nconf = require('nconf');
const debugUnsupported = require('debug')('bin:parse2:UNSUPPORTED');
const debugError = require('debug')('bin:parse2:ERROR');
const JSDOM = require('jsdom').JSDOM;

const videoparser = require('../parsers/video')
const mongo3 = require('../lib/mongo3');
const parse = require('../lib/parse');
const automo = require('../lib/automo')

nconf.argv().env().file({ file: 'config/settings.json' });

/*
const echoes = require('../lib/echoes');
echoes.addEcho("elasticsearch");
echoes.setDefaultEcho("elasticsearch");
*/

const FREQUENCY = _.parseInt(nconf.get('frequency')) ? _.parseInt(nconf.get('frequency')) : 10;
const backInTime = _.parseInt(nconf.get('minutesago')) ? _.parseInt(nconf.get('minutesago')) : 10;

var lastExecution = moment().subtract(backInTime, 'minutes').toISOString();

console.log(`considering ${backInTime} minutes ago. Override the 10 minutes standard check. Starts since ${lastExecution}`);

function sleep(ms) {
    return new Promise(resolve=>{
        setTimeout(resolve,ms)
    })
}

async function newLoop() {
    const old_version = '1.1.8';
    const new_version = '1.2.1';
    let htmlFilter = {
        savingTime: {
            $gt: new Date(lastExecution)
        },
        processed: { $exists: !!nconf.get('repeat') }
    };

    lastExecution = moment().subtract(2, 'm').toISOString();
    debug("filter %j last exec %s", htmlFilter, lastExecution)
    const htmls = await automo.getLastHTMLs(htmlFilter);

    debug("Matching objects %d", _.size(htmls));

    const analysis = await _.map(htmls, async function(e) { 

        const envelop = {
            impression: _.omit(e, ['html','publicKey', '_id']),
            jsdom: new JSDOM(e.html.replace(/\n\ +/g, ''))
                    .window.document,
        }
        envelop.impression.videoId = _
            .replace(e.href, /.*v=/, '')
            .replace(/\?.*/, '')
            .replace(/\&.*/,'');

        let metadata = null;
        try {
            debug("%s href %s with %s html bytes, %s", e.id, e.href, e.size, e.selector);

            if(e.selector == ".ytp-title-channel") {
                metadata = videoparser.adTitleChannel(envelop);
            }
            else if(e.selector == ".video-ads.ytp-ad-module") {
                metadata = videoparser.videoAd(envelop);
            }
            else if(e.selector == "ytd-app") {
                metadata = videoparser.process(envelop);
            }
            else if(e.selector == ".ytp-ad-player-overlay-instream-info") {
                metadata = videoparser.overlay(envelop);
            }
            else {
                console.log("Selector not supported!", e.selector);
                process.exit(1);
            }

            if(_.isNull(metadata))
                return null;

        } catch(error) {
            debug("Error in video processing: %j", error);
            return null;
        }

        return await automo.updateMetadata(e, metadata);

        /*
        envelop.metadata = metadata;
        envelop.impression.processed = true;
        envelop.metadata.id = envelop.impression.id;
        envelop.metadata.videoId = envelop.impression.videoId;
        envelop.metadata.savingTime = envelop.impression.savingTime;
        envelop.metadata.watcher = envelop.impression.p;
        // TODO: extract URL metadata, such as &t=502s 
        _.unset(envelop, 'jsdom');
        return envelop;
        */
    });

    debug("Results %d/%d: %s",
        _.size(_.compact(analysis)),
        _.size(analysis),
        JSON.stringify(_.compact(analysis), undefined, 2));

    await sleep(FREQUENCY * 1000)
    /* infinite recursive loop */
    await newLoop();
}

try {
    newLoop();
} catch(e) {
    debug(e);
}


