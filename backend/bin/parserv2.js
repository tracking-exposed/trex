#!/usr/bin/env node
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
    let repeat = !!nconf.get('repeat');
    debug("Last exec at %s %s", lastExecution, typeof lastExecution);
    let htmlFilter = {
        savingTime: {
            $gt: new Date(lastExecution)
        },
    };

    htmlFilter.processed = { $exists: repeat };

    const htmls = await automo.getLastHTMLs(htmlFilter);
    debug("Matching objects %d, overflow %s", _.size(htmls.content), htmls.overflow);

    if(!htmls.overflow) {
        lastExecution = moment().subtract(2, 'm').toISOString();
        debug("NOVERFLOW filter %j, last %s", htmlFilter, lastExecution);
    }
    else {
        lastExecution = moment(_.last(htmls.content).savingTime);
        debug("OVERFLOW: first %s last %s", _.first(htmls.content).savingTime,
            _.last(htmls.content).savingTime);
        debug("Last exec at %s %s", lastExecution, typeof lastExecution);
    }

    const analysis = _.map(htmls.content, function(e) { 
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
            debug("%s %d.%d href %s with %s html bytes, %s",
                e.id, e.packet, e.incremental, e.href, e.size, e.selector);

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

        return [ e, _.omit(metadata, ['html']) ];
    });

    debug("Usable HTMLs %d/%d", _.size(_.compact(analysis)), _.size(htmls.content));

    const queries = _.compact(analysis).reduce( (previousPromise, blob) => {
        return previousPromise.then(() => {
            return automo.updateMetadata(blob[0], blob[1]);
        });
    }, Promise.resolve());

    await sleep(FREQUENCY * 1000)
    /* infinite recursive loop */
    await newLoop();
}

try {
    newLoop();
} catch(e) {
    console.log("Error in newLoop", e.message);
}
