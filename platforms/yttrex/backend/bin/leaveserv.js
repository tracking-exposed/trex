#!/usr/bin/env node
const _ = require('lodash');
const fs = require('fs');
const moment = require('moment');
const nconf = require('nconf');
const JSDOM = require('jsdom').JSDOM;

const debug = require('debug')('yttrex:leaveserv');
const debuge = require('debug')('yttrex:leaveserv:error');
const debugads = require('debug')('yttrex:ads');
const debugres = require('debug')('leaveserv:result');
const overflowReport = require('debug')('leaveserv:OVERFLOW');

const automo = require('../lib/automo');

nconf.argv().env().file({ file: 'config/settings.json' });

// this script is a specialized and experience version of
// parserv2.js, only dedicated to work on advertising

const FREQUENCY = 15; // seconds
const AMOUNT_DEFAULT = 20;
const BACKINTIMEDEFAULT = 1; // minutes

let skipCount = _.parseInt(nconf.get('skip')) ? _.parseInt(nconf.get('skip')) : 0;
let htmlAmount = _.parseInt(nconf.get('amount')) ? _.parseInt(nconf.get('amount')) : AMOUNT_DEFAULT;

const stop = _.parseInt(nconf.get('stop')) ? (_.parseInt(nconf.get('stop')) + skipCount): 0;
const backInTime = _.parseInt(nconf.get('minutesago')) ? _.parseInt(nconf.get('minutesago')) : BACKINTIMEDEFAULT;
const id = nconf.get('id');
const filter = nconf.get('filter') ? JSON.parse(fs.readFileSync(nconf.get('filter'))) : null;
const singleUse = !!id;

const selector = nconf.get('selector') || null;
const allowedSelectors = [ "banner", "ad", "overlay", "toprightad",
    "toprightpict", "toprightcta", "toprightattr", "adbadge",
    "channel", "searchcard", "channellink", "searchAds" ];

if(selector) {
    if(allowedSelectors.indexOf(selector) === -1) {
        // eslint-disable-next-line no-console
        return console
            .log(`Error ${selector} should be one of ${allowedSelectors}`);
    }
}

let nodatacounter = 0;
let processedCounter = skipCount;
let lastExecution = moment().subtract(backInTime, 'minutes').toISOString();
let computedFrequency = 10;
const stats = { lastamount: null, currentamount: null, last: null, current: null };

if(backInTime !== BACKINTIMEDEFAULT) {
    const humanized = moment.duration(
        moment().subtract(backInTime, 'minutes') - moment()
    ).humanize();
    debug(`Considering ${backInTime} minutes (${humanized}), as override the standard ${BACKINTIMEDEFAULT} minutes ${lastExecution}`);
}

async function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    })
}

function mineAd(D, e) {
    const sponsoredSite = D.querySelector('.ytp-ad-button-text').textContent;
    const remaining = D.querySelector(".ytp-ad-duration-remaining").textContent;
    const fixed = remaining.length > 6 ?
        remaining : "00:" + remaining;
    const adseconds = moment.duration(fixed).asSeconds();
    return {
        sponsoredSite,
        adseconds,
    };
}

function mineOverlay(D, e) {
    const buttons = D.querySelectorAll('.ytp-ad-button-link');
    const sponsoredSite = _.reduce(buttons, function(memo, b) {
        if(memo)
            return memo;
        if(b.textContent.length)
            return b.textContent;
    }, null);
    return { sponsoredSite };
}

function mineTRP(D, e) {
    const header  = D.querySelector("#header");
    const domain = D.querySelector('#domain');
    if(!header && !domain)
        return null;
    const retval = {};
    if(header)
        retval.sponsoredName = header.textContent.trim();
    if(domain)
        retval.sponsoredSite = domain.textContent.trim();
    return retval;
}

function mineAdBadge(D, e) {
    const h3 = D.querySelector('h3');
    const wt = D.querySelector("#website-text");
    // one of the two conditions
    const header = D.querySelector('#header');
    const domain = D.querySelector('#domain');

    if(wt && h3)
        return {
            sponsoredName: h3.textContent.trim(),
            sponsoredSite: wt.textContent.trim(),
        };
    else if(header && domain)
        return {
            sponsoredName: header.textContent.trim(),
            sponsoredSite: domain.textContent.trim(),
        }
    else
        return null;
}

function mineChannel(D, e) {
    const a = D.querySelector('a');
    const channelLink = a.getAttribute('href');
    const ct = D.querySelector("#text");
    const channelName = ct ?
        ct.textContent.trim() : a.textContent.trim();

    if(channelName && (channelLink.split('/')[1] === 'channel')) {
        return {
            channelName,
            channelId: channelLink.split('/')[2]
        };
    }
}

function mineBanner(D, e) {

    /* exclude the 'Ads in 2' label, among others */
    if(e.acquired[0].html.length < 350)
        return null;

    const imgs = D.querySelectorAll('img');
    if(imgs.length === 0) {
        const errorretval = {
            error: true, reason: 1,
            images: imgs.length,
            wouldebug: e.acquired[0].html.length > 6000,
            htmlsize: e.acquired[0].html.length,
            texts: D.querySelector('div').textContent
        }
        debuge("mineBanner error: %O", errorretval);
        if(e.acquired[0].html.length > 6000) {
            // eslint-disable-next-line no-console
            console.trace("DEBUG HERE!")
        }
        return errorretval;
    }

    const spans = D.querySelectorAll('span');
    if(!spans.length) {
        const errorretval = {
            error: true, reason: 2,
            wouldebug: e.acquired[0].html.length > 2000,
            htmlsize: e.acquired[0].html.length,
            texts: D.querySelector('div').textContent
        }
        debuge("mineBanner error: %O", errorretval);
        if(e.acquired[0].html.length > 2000) {
            // eslint-disable-next-line no-console
            console.trace("DEBUG HERE!")
        }
        return errorretval;
    }

    /* pick the first span with a value */
    const buyer = _.reduce(spans, function(memo, span) {
        if(memo) return memo;
        if(span.textContent.length > 0)
            memo = span.textContent;
        return memo;
    }, null);

    const retval = { buyer };
    if(imgs.length === 1) {
        const videot = imgs[0].getAttribute('src');
        if(!_.endsWith(videot, "mqdefault.jpg"))
            debuge("Unexpected condition! %s", videot);
        
        return {
            ...retval,
            videot
        }
    }
    /* else */
    return {
        buyeri: imgs[0].getAttribute('src'),
        videot: imgs[1].getAttribute('src'),
        ...retval,
    }
}

function processLeaf(e) {
    // e is the 'element', it comes from the DB, and we'll look the 
    // e.html mostly. different e.selecotrName causes different sub-functions
    if(allowedSelectors.indexOf(e.selectorName) === -1) {
        // debug("Invalid/Unexpected selector received: %s", e.metadataId);
        return null;
    }

    let mined = null;
    try {
        const D = new JSDOM(e.html).window.document;
        // eslint-disable-next-line no-console
        // console.log(e.nature, e.selectorName);

        if(e.selectorName === 'ad')
            mined = mineAd(D, e)
        else if(e.selectorName === 'banner')
            mined = mineBanner(D, e)
        else if(e.selectorName === 'overlay')
            mined = mineOverlay(D, e)
        else if(e.selectorName === 'toprightpict')
            mined = mineTRP(D, e)
        else if(e.selectorName === 'channel')
            mined = mineChannel(D, e);
        else if(e.selectorName === 'adbadge')
            mined = mineAdBadge(D, e);
        else
            debug("Selector not handled %s", e.selectorName);

        // eslint-disable-next-line no-console
        // console.log(mined);
    } catch(error) {
        debug("Error in content mining (%s %s): %s",
            e.selectorName, e.metadataId, error.message);
        return null;
    }

    if(_.isNull(mined)) return null;

    const retval = _.pick(e, ["nature", "selectorName",
        "offsetTop", "offsetLeft", "href", "metadataId",
        "id", "savingTime", "publicKey"]);

    /* this happens here because this is *the code loop*
       where ADs is processed, and should be redoundant 
       if exist any other place that is a parser-provider ---
    -- experiment support, if there is an object with that 
    name saved from the input (routes/events) make a copy.
    Remind: the experiments are ephemerals (18 hours TTL)      */
    if(e.experiment)
        retval.experiment = e.experiment;

    return {
        ...retval,
        ...mined,
    };
}

async function fetchAndAnalyze(filter) {
    /* this is the begin of the label parser pipeline, labelFilter contains a shifting savingTime to take
     * the oldest before and the most recent later. It is meant to constantly monitoring 'labels' for the new one */

    const leaves = await automo.getLastLeaves(filter, skipCount, htmlAmount);
    if(!_.size(leaves.content)) {

        nodatacounter++;
        if( (nodatacounter % 10) === 1)
            debug("%d no data at the last query: %j", processedCounter, filter);

        lastExecution = moment().toISOString();
        computedFrequency = FREQUENCY;
        return;
    } else {
        computedFrequency = 0.01;
        nodatacounter = 0;
    }

    if(!leaves.overflow) {
        lastExecution = moment().toISOString();
        /* 1 minute is the average stop, so it comeback to check 3 minutes before */
        overflowReport("<NOT>\t\t%d documents [mago %d]",
            _.size(leaves.content), _.size(leaves.content) ?
                _.round(moment.duration( moment() - moment(_.last(leaves.content).savingTime)).asMinutes(), 1) :
                NaN
        );
    }
    else {
        lastExecution = moment(_.last(leaves.content).savingTime);
        const mago = _.round(moment.duration( moment() - moment(_.last(leaves.content).savingTime)).asMinutes(), 1);
        overflowReport("first %s [mago %d] (on %d) <window of %d minutes> next filter set to %s",
            _.first(leaves.content).savingTime, mago, _.size(leaves.content),
            _.round(moment.duration(
                moment(_.last(leaves.content).savingTime ) - moment(_.first(leaves.content).savingTime )
            ).asMinutes(), 1),
            lastExecution);
    }

    if(stats.currentamount || stats.lastamount)
        debug("[+] %d start a new cicle, %d took: %s and now process %d htmls",
            processedCounter,
            stats.currentamount, moment.duration(moment() - stats.current).humanize(),
            _.size(leaves.content));
    stats.last = stats.current;
    stats.current = moment();
    stats.lastamount = stats.currentamount;
    stats.currentamount = _.size(leaves.content);

    /* this block calls processAds with focus on actual Ads  */
    const advertising = _.compact(_.map(leaves.content, processLeaf));
    if(_.size(advertising)) {
        const advretv = await automo.updateAdvertisingAndMetadata(advertising);
        debugads("%d processed, took %d secs = %d mins [ %d +ads ]",
            processedCounter, moment.duration(moment() - stats.current).asSeconds(),
            _.round(moment.duration(moment() - stats.current).asMinutes(), 2),
            advretv
        );
    }

    if(!_.size(advertising))
        debugres("From %d entries in DB, 0 advertising, still to process|choke: %O",
            leaves.content.length,
            _.countBy(leaves.content, 'selectorName'))
    else
        debugres("%d completed, took %d secs = %d mins (%O)",
            processedCounter, moment.duration(moment() - stats.current).asSeconds(),
            _.round(moment.duration(moment() - stats.current).asMinutes(), 2),
            _.countBy(leaves.content, 'selectorName')
        );

    processedCounter += leaves.content.length;
}

async function wrapperLoop() {
    while(true) {
        try {
            let labelFilter = {
                savingTime: {
                    $gte: new Date(lastExecution)
                },
            };
            if(filter)
                labelFilter.metadataId = { '$in': filter };
            if(id) {
                labelFilter = {
                    metadataId: id
                }
                debug("Targeting a specific metadataId: %s", id);
            }
            if(selector) {
                labelFilter.selectorName = selector;
            }

            if(stop && stop <= processedCounter) {
                // eslint-disable-next-line no-console
                console.log("Reached configured limit of ", stop, "( processed:", processedCounter, ")");
                process.exit(processedCounter);
            }

            await fetchAndAnalyze(labelFilter);
        }
        catch(e) {
            // eslint-disable-next-line no-console
            console.log("Error in fetchAndAnalyze", e.message, e.stack);
        }
        if(singleUse) {
            debug("Single execution done!")
            process.exit(0);
        }
        await sleep(computedFrequency * 1000)
    }
}

try {
    if(filter && id) {
        // eslint-disable-next-line no-console
        return console.log("Invalid combo, you can't use --filter and --id");
    }

    if(selector) {
        if(id) {
            // eslint-disable-next-line no-console
            return console.log("Invalid combo, you can't use --selector and --id");
        }
        debug("Targeting selectorName %s", selector);
    }

    if( id && (skipCount || (htmlAmount !== AMOUNT_DEFAULT) ) ) {
        debug("Ignoring --skip and --amount because of --id");
        skipCount = 0;
        htmlAmount = AMOUNT_DEFAULT;
    }

    if(stop && htmlAmount > (stop - skipCount) ) {
        htmlAmount = (stop - skipCount);
        debug("--stop %d imply --amount %d", stop, htmlAmount);
    }

    wrapperLoop();
} catch(e) {
    // eslint-disable-next-line no-console
    console.log("Error in wrapperLoop", e.message);
}
