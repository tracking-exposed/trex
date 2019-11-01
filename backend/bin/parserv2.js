#!/usr/bin/env node
const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('bin:parse2');
const nconf = require('nconf');
const JSDOM = require('jsdom').JSDOM;

const videoparser = require('../parsers/video')
const automo = require('../lib/automo')

nconf.argv().env().file({ file: 'config/settings.json' });

/* const echoes = require('../lib/echoes');
echoes.addEcho("elasticsearch");
echoes.setDefaultEcho("elasticsearch"); */

const FREQUENCY = _.parseInt(nconf.get('frequency')) ? _.parseInt(nconf.get('frequency')) : 10;
const backInTime = _.parseInt(nconf.get('minutesago')) ? _.parseInt(nconf.get('minutesago')) : 10;
const id = nconf.get('id');
let singleUse = !!nconf.get('single');
let nodatacounter = 0;
let lastExecution = moment().subtract(backInTime, 'minutes').toISOString();

if(backInTime != 10) {
    const humanized = moment.duration(
        moment().subtract(backInTime, 'minutes') - moment()
    ).humanize();
    console.log(`Considering ${backInTime} minutes (${humanized}), as override the standard 10 minutes ${lastExecution}`);
}

async function newLoop() {
    let repeat = !!nconf.get('repeat');
    let htmlFilter = {
        savingTime: {
            $gt: new Date(lastExecution)
        },
    };
    htmlFilter.processed = { $exists: repeat };

    if(id) {
        debug("Targeting a specific metadataId imply --single");
        htmlFilter = {
            metadataId: id
        }
        singleUse = true;
    }

    const htmls = await automo.getLastHTMLs(htmlFilter);
    if(!_.size(htmls.content)) {
        nodatacounter++;
        if( (nodatacounter % 10) == 1) {
            debug("%d no data at the last query: %j",
                nodatacounter, htmlFilter);
        }
        lastExecution = moment().subtract(2, 'm').toISOString();
        await sleep(FREQUENCY * 1000)
        /* infinite recursive loop */
        await newLoop();
    }

    if(!htmls.overflow) {
        lastExecution = moment().subtract(2, 'm').toISOString();
        debug("Matching objects %d, overflow %s",
            _.size(htmls.content), htmls.overflow);
    }
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
      
        let metadata = null;
        try {
            debug("%s [%s] %s %d.%d %s %s %s",
                e.id.substr(0, 4),
                moment(e.savingTime).format("HH:mm"),
                e.metadataId.substr(0, 6),
                e.packet, e.incremental,
                e.href.replace(/https:\/\//, ''), e.size, e.selector);

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

        return [ envelop.impression, _.omit(metadata, ['html']) ];
    });

    const meaningful = _.compact(analysis);

    for (const entry of meaningful) {
        await automo.updateMetadata(entry[0], entry[1]);
    }

    /* reset no-data-counter if data has been sucessfully processed */
    if(_.size(_.compact(analysis)))
        nodatacounter = 0;

    /* also the HTML cutted off the pipeline, the many skipped 
     * by _.compact all the null in the lists, should be marked as processed */
    const remaining = _.reduce(_.compact(analysis), function(memo, blob) {
        return _.reject(memo, { id: blob[0].id });
    }, htmls.content);

    debug("Usable HTMLs %d/%d - marking as processed the useless %d HTMLs", 
        _.size(_.compact(analysis)), _.size(htmls.content), _.size(remaining));

    for (const html in remaining) {
        await automo.updateMetadata(html, null);
    }

    if(!singleUse || htmls.overflow) {
        await sleep(FREQUENCY * 1000)
        await newLoop();
    } else {
        console.log("Single execution done!")
        process.exit(0);
    }
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
