#!/usr/bin/env node
const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('yttrex:parserv');
const overflowReport = require('debug')('yttrex:OVERFLOW');
const nconf = require('nconf');
const JSDOM = require('jsdom').JSDOM;
const fs = require('fs');

const videoparser = require('../parsers/video')
const homeparser = require('../parsers/home')
const automo = require('../lib/automo')

nconf.argv().env().file({ file: 'config/settings.json' });

/* const echoes = require('../lib/echoes');
echoes.addEcho("elasticsearch");
echoes.setDefaultEcho("elasticsearch"); */

const FREQUENCY = _.parseInt(nconf.get('frequency')) ? _.parseInt(nconf.get('frequency')) : 10;
const backInTime = _.parseInt(nconf.get('minutesago')) ? _.parseInt(nconf.get('minutesago')) : 10;
const id = nconf.get('id');
const filter = nconf.get('filter') ? JSON.parse(fs.readFileSync('internal-ωτ1-v3.json')) : null;
const singleUse = !!id;

let skipCount = _.parseInt(nconf.get('skip')) ? _.parseInt(nconf.get('skip')) : 0;
let htmlAmount = _.parseInt(nconf.get('amount')) ? _.parseInt(nconf.get('amount')) : 20;

let nodatacounter = 0;
let processedCounter = skipCount;
let lastExecution = moment().subtract(backInTime, 'minutes').toISOString();
let computedFrequency = FREQUENCY;

if(backInTime != 10) {
    const humanized = moment.duration(
        moment().subtract(backInTime, 'minutes') - moment()
    ).humanize();
    console.log(`Considering ${backInTime} minutes (${humanized}), as override the standard 10 minutes ${lastExecution}`);
}

const advSelectors = {
    ".ytp-title-channel": videoparser.adTitleChannel,
    ".video-ads.ytp-ad-module": videoparser.videoAd,
    ".ytp-ad-player-overlay-instream-info": videoparser.overlay,
    ".ytp-chrome-top": videoparser.videoTitleTop,
    ".ytp-title-text": videoparser.videoTitleTop,
};

async function newLoop() {
    let repeat = !!nconf.get('repeat');
    let htmlFilter = {
        savingTime: {
            $gt: new Date(lastExecution)
        },
    };
    htmlFilter.processed = { $exists: repeat };

    if(filter) {
        console.log("Using filter, %d", _.size(filter));
        htmlFilter.id = { '$in': filter };
    } else if(id) {
        debug("Targeting a specific metadataId imply --single");
        htmlFilter = {
            metadataId: id
        }
    }

    const htmls = await automo.getLastHTMLs(htmlFilter, skipCount, htmlAmount);
    if(!_.size(htmls.content)) {
        nodatacounter++;
        if( (nodatacounter % 10) == 1) {
            debug("%d no data at the last query: %j",
                nodatacounter, htmlFilter);
        }
        lastExecution = moment().subtract(2, 'm').toISOString();
        computedFrequency = FREQUENCY;
        return;
    } else {
        computedFrequency = 0.1;
    }

    if(!htmls.overflow) {
        lastExecution = moment().subtract(2, 'm').toISOString();
        overflowReport("<NOT>\t\t%d documents", _.size(htmls.content));
    }
    else {
        lastExecution = moment(_.last(htmls.content).savingTime);
        overflowReport("first %s (on %d) <last +minutes %d> next filter set to %s",
            _.first(htmls.content).savingTime, _.size(htmls.content),
            _.round(moment.duration(
                moment(_.last(htmls.content).savingTime ) - moment(_.first(htmls.content).savingTime )
            ).asMinutes(), 1),
            lastExecution);
    }

    const analysis = _.map(htmls.content, function(e) {

        if(!e || !e.html || _.size(e.html) < 2) {
            debug("Unexpected entry %s html empty", e.id);
            return null;
        }

        const envelop = {
            impression: _.omit(e, ['html', '_id']),
            jsdom: new JSDOM(e.html.replace(/\n\ +/g, ''))
                    .window.document,
        }

        let metadata = null;
        try {
            processedCounter++;
            debug("#%d\ton (%d minutes ago) %s %d.%d %s %s %s",
                processedCounter,
                _.round(moment.duration( moment() - moment(e.savingTime)).asMinutes(), 0),
                e.metadataId,
                e.packet, e.incremental,
                e.href.replace(/https:\/\//, ''), e.size, e.selector);

            const curi = e.href.replace(/.*youtube\.com\//, '').replace(/\?.*/, '')

            if(!_.size(curi) && e.selector == "ytd-app") {
                /* without clean URI, it is an youtube home */
                metadata = homeparser.process(envelop);
            }
            else if(e.selector == "ytd-app") {
                /* else, if is ytd-app, it is a full video content */
                metadata = videoparser.process(envelop);
            }
            else if(_.indexOf(_.keys(advSelectors), e.selector) != -1)  {
                /* if the selector is one of the adveritising related dissector, find it out */
                metadata = advSelectors[e.selector](envelop, e.selector);
                /* possible fields: 'adLink', 'adLabel', 'adChannel' */
            } else {
                console.log("Selector not supported!", e.selector);
                return null;
            }

            if(!metadata)
                return null;

        } catch(error) {
            debug("[!E] #%d\t selector (%s) error: %s", processedCounter, e.selector, error.message);
            return null;
        }

        return [ envelop.impression, metadata ];
    });

    const updates = [];
    for (const entry of _.compact(analysis)) {
        let r = await automo.updateMetadata(entry[0], entry[1], repeat);
        updates.push(r);
    }
    debug("%d html.content, %d analysis, compacted %d, effects: %j",
        _.size(htmls.content), _.size(analysis),
        _.size(_.compact(analysis)), _.countBy(updates, 'what'));

    /* reset no-data-counter if data has been sucessfully processed */
    if(_.size(_.compact(analysis)))
        nodatacounter = 0;

    /* also the HTML cutted off the pipeline, the many skipped
     * by _.compact all the null in the lists, should be marked as processed */
    const remaining = _.reduce(_.compact(analysis), function(memo, blob) {
        return _.reject(memo, { id: blob[0].id });
    }, htmls.content);

    debug("Usable HTMLs %d/%d - marking as processed the useless %d HTMLs\t\t(sleep %d)",
        _.size(_.compact(analysis)), _.size(htmls.content), _.size(remaining), computedFrequency);

    await automo.markHTMLsUnprocessable(remaining);
}

function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    })
}

async function wrapperLoop() {
    while(true) {
        try {
            await newLoop();
        } catch(e) {
            console.log("Error in newLoop", e.message, e.stack);
        }
        if(singleUse) {
            console.log("Single execution done!")
            process.exit(0);
        }
        await sleep(computedFrequency * 1000)
    }
}

try {
    wrapperLoop();
} catch(e) {
    console.log("Error in wrapperLoop", e.message);
}
