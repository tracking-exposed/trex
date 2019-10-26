#!/usr/bin/env node
const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('bin:parse2');
const nconf = require('nconf');
const JSDOM = require('jsdom').JSDOM;

const videoparser = require('../parsers/video')
const automo = require('../lib/automo')

nconf.argv().env().file({ file: 'config/settings.json' });

/*
const echoes = require('../lib/echoes');
echoes.addEcho("elasticsearch");
echoes.setDefaultEcho("elasticsearch");
*/

const FREQUENCY = _.parseInt(nconf.get('frequency')) ? _.parseInt(nconf.get('frequency')) : 10;
const backInTime = _.parseInt(nconf.get('minutesago')) ? _.parseInt(nconf.get('minutesago')) : 10;

let lastExecution = moment().subtract(backInTime, 'minutes').toISOString();

if(backInTime != 10)
    console.log(`considering ${backInTime} minutes, as override the standard 10 minutes ${lastExecution}`);

let nodatacounter = 0;

async function newLoop() {
    let repeat = !!nconf.get('repeat');
    let htmlFilter = {
        savingTime: {
            $gt: new Date(lastExecution)
        },
    };

    htmlFilter.processed = { $exists: repeat };
    const htmls = await automo.getLastHTMLs(htmlFilter);
    if(!_.size(htmls.content)) {
        nodatacounter++;
        if( (nodatacounter % 10) == 0) {
            debug("%d\tno data at the last query: %j",
                nodatacounter, htmlFilter);
        }
        lastExecution = moment().subtract(2, 'm').toISOString();

        await sleep(FREQUENCY * 1000)
        /* infinite recursive loop */
        await newLoop();
    }

    debug("Matching objects %d, overflow %s", _.size(htmls.content), htmls.overflow);

    if(!htmls.overflow)
        lastExecution = moment().subtract(2, 'm').toISOString();
    else {
        lastExecution = moment(_.last(htmls.content).savingTime);
        debug("OVERFLOW: first %s last %s - lastExecution %s", 
            _.first(htmls.content).savingTime, _.last(htmls.content).savingTime,
            lastExecution);
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
                return null;
            }

            if(_.isNull(metadata))
                return null;

        } catch(error) {
            debug("Error in video processing: %s (%s)", error, e.selector);
            return null;
        }

        return [ e, _.omit(metadata, ['html']) ];
    });

    debug("Usable HTMLs %d/%d", _.size(_.compact(analysis)), _.size(htmls.content));

    /* this is meant to execute one db-access per time,
     * and avoid any collision behavior. */
    _.compact(analysis).reduce( (previousPromise, blob) => {
        return previousPromise.then(() => {
            return automo.updateMetadata(blob[0], blob[1]);
        });
    }, Promise.resolve());

    /* also the HTML cutted off the pipeline, the many
     * skipped by _.compact all the null in the lists,
     * should be marked as processed */
    const remaining = _.reduce(_.compact(analysis), function(memo, blob) {
        debug("%s and after %s", 
        _.size(memo),
        _.size(_.reject(memo, { id: blob[0].id })));

        return _.reject(memo, { id: blob[0].id });
    }, htmls.content);

    debug("Stripped HTMLs %d", _.size(remaining));
    _.reduce(remaining, (previousPromise, html) => {
        return previousPromise.then(() => {
            return automo.updateMetadata(html, null);
        });
    }, Promise.resolve());

    await sleep(FREQUENCY * 1000)
    /* infinite recursive loop */
    await newLoop();
}

function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    })
}

try {
    newLoop();
} catch(e) {
    console.log("Error in newLoop", e.message);
}
