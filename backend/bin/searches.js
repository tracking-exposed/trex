#!/usr/bin/env node
const _ = require('lodash');
const fs = require('fs');
const url = require('url');
const qustr = require('querystring');
const moment = require('moment');
const nconf = require('nconf');
const JSDOM = require('jsdom').JSDOM;

const debug = require('debug')('yttrex:searches');
const debuge = require('debug')('yttrex:searches:error');
const overflowReport = require('debug')('yttrex:label:OVERFLOW');

const longlabel = require('../parsers/longlabel');
const automo = require('../lib/automo');
const utils = require('../lib/utils');

nconf.argv().env().file({ file: 'config/settings.json' });

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *  * * * *
   this script is a specialized and experience version of parserv2.js, only dedicated *
   to work on 'labels' -- it implement here as many functions as possible             *
                                                                                      *
1) use lastExecution, skip, filter, stop and id in the same way of parserv2           *
2) it pick from 'labels' only with { selectorName: 'label' }                          *
3) it use metadataId to find and update the entries in 'searches'                     *
4) there are not nested fields, the 'searches' entry has:                    {
    metadataId: unique identifier of the search query evidence,
    id: unique id for each entry <String>,
    publicKey: <String>,
    searchQuery: <String>,
    videoId: <String>,
    [and the mined fields from aria-label],
    <incomplete>: undefined or true, wheres error are present in extraction
}                                                                                     */

const FREQUENCY = 5; // seconds
const AMOUNT_DEFAULT = 20;
const BACKINTIMEDEFAULT = 1; // minutes 

let skipCount = _.parseInt(nconf.get('skip')) ? _.parseInt(nconf.get('skip')) : 0;
let htmlAmount = _.parseInt(nconf.get('amount')) ? _.parseInt(nconf.get('amount')) : AMOUNT_DEFAULT;

const stop = _.parseInt(nconf.get('stop')) ? (_.parseInt(nconf.get('stop')) + skipCount): 0;
const backInTime = _.parseInt(nconf.get('minutesago')) ? _.parseInt(nconf.get('minutesago')) : BACKINTIMEDEFAULT;
const id = nconf.get('id');
const filter = nconf.get('filter') ? JSON.parse(fs.readFileSync(nconf.get('filter'))) : null;
const singleUse = !!id;

let nodatacounter = 0;
let processedCounter = skipCount;
let lastExecution = moment().subtract(backInTime, 'minutes').toISOString();
let computedFrequency = 10;
const stats = { lastamount: null, currentamount: null, last: null, current: null };
let lastErrorAmount = 0;

if(backInTime != BACKINTIMEDEFAULT) {
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

function prepareObjectList(o) {
    try {
        const D = new JSDOM(o.html).window.document;
        const node = D.querySelector('[aria-label]');

        if(_.isNull(node))
            return null;
        else if(node.tagName === 'A' && node.getAttribute('id') == 'video-title') {
            o.nature = 'video';
            o.title = node.getAttribute('title');
            o.href = node.getAttribute('href');
        }
        else if (node.tagName === 'SPAN') { // classList.indexOf('ytd-thumbnail-overlay-time-status-renderer') !== -1 ) {
            o.nature = 'duration';
            o.displayLength = node.textContent.trim();
        }
        else if ( node.tagName === 'A' && _.startsWith(node.getAttribute('href'), '/channel/' ) ) {
            o.nature = 'author';
            o.href = node.getAttribute('href');
        }
        else
            return null;

        const ariala = node.getAttribute('aria-label');
        _.unset(o, 'html');
        _.set(o, 'node', node);
        _.set(o, 'ariala', ariala);
        return o;
    }
    catch(error) {
        debuge("#%d\terror: %s", processedCounter, error.message);
        return null;
    }
};

/* this function has to hack and slack the aria-label and find out where is the authorName */
function dissectAndParseLabel(arilabel, title, durationlabel, uxInfo) {
    // assuming the longlabel is:
    // "Introducing Blackview BV9900 Pro, the World's Fastest Thermal Rugged Phone by Blackview 2 months ago 1 minute, 44 seconds 239,340 views"
    let first;
    // we've to manage differently the separators present, like 'by' compared to no separator.
    if(_.size(uxInfo.separator)) {
        const separator =` ${uxInfo.separator} `;
        first = _.last(arilabel.split(separator));
    } else {
        const separatorL = _.size(title) + 1;
        first = arilabel.substr(separatorL);
    }
    // first is 'Blackview 2 months ago 1 minute, 44 seconds 239,340 views'
    const re = new RegExp(durationlabel + ".*","g");
    // /1 minute, 44 seconds.*/g
    const second = first.replace(re, '');
    // "Blackview 2 months ago "
    const authorName = second.replace(/\s\d{1,2}\s\w+\s?.*/, '');
    // Blackview

    // Because author like 'Cannel 4 News' break with this regexp, this was a test:
    // const authorName = second.replace(/\s\d{1,2}\s\w+\s?\w+?$/, '');
    // but this causes other failure in longlabel.parser

    try {
        const mined = longlabel.parser(arilabel, authorName, null);
        return { authorName, mined };
    } catch(e) {
        debuge("Error in longlabel.parser (%s, %s): %s",
            arilabel, authorName, e.message);
        longlabel.unrecognized.push(arilabel);
        return { authorName, mined: null };
    }
}

function fuzzyFind(nodes, natureKind, expectedPlace) {
    /* to understand this is simpler to print 'nodes' around line 173 */
    return _.reduce([-2, -1, 0, 1, 2], function(memo, variation) {
        if(memo) return memo;
        let trynow = _.find(nodes, { nature: natureKind, order: expectedPlace + variation});
        return trynow ? trynow : null;
    }, null);
}

function processSearches(e, i) {
    /* main function invoked by the core loop, it is argument of _.map,
     * return either null or a list of video belonging to a search result */
    processedCounter++;

    if(!e || !e.acquired || _.size(e.acquired)  === 0 ) {
        debuge("Unmanaged labels.id %s has empty 'acquired' labels", e.id);
        return null;
    }

    const uq = url.parse(e.href);
    if(uq.pathname !== '/results')
        return null;

    const searchTerms = _.trim(qustr.parse(uq.query).search_query);

    /* extend db object with DOM and compute side effects stats */
    const nodes = _.compact(_.map(e.acquired, prepareObjectList));
    if(!_.size(nodes)) {
        debug("%d) No nodes found in\t\t\t\t%s, quitting processing", i, e.metadataId);
        return null;
    }

    const possibleWordForViews = _.reduce(nodes, function(memo, n) {
        // long aria-label are the one we are interested on
        // > "1 hour, 12 minutes, 12 seconds, 1 day".length  =  37
        // 50 as tolerance in case non english labels have longer names
        if(n.ariala.length < 50) return memo;
        let w = _.last(n.ariala.split(' '));
        _.set(memo, w, _.get(memo, w, 0) ? _.get(memo, w) + 1 : 1);
        return memo;
    }, {});

    /* possibleWordForViews if printed contains:
        yttrex:label {"views":26,"channel":26,"link":1,"(SHIFT+n)":1}
       but it might be empty too because 'views' can't be there, but only 'minutes' 'seconds' ... */

    let uxInfo = null;
    try {
        uxInfo = longlabel.guessLanguageByViews(_.keys(possibleWordForViews));
    } catch(error) {
        // the same metadataId, can match that information 
        // debug("Error catch in guessLanguageByViews: %s", error.message);
        // debug("Labels in %s: %s", e.metadataId, JSON.stringify(_.map(nodes, 'ariala'), undefined, 2));
        debug("%d) No usable labels in\t\t\t%s: %s", i, e.metadataId, error.message);
        return null;
    }
    /* uxInfo now contains uxInfo.locale and uxInfo.separator */

    const foundVideos = _.filter(nodes, { nature: 'video'});
    /* the function below is instead of a _.reduce with a FSM inside. we need to take three objects with this 
       patten to build a complete video entry: {
        order: 138,
        nature: 'duration',
        displayLength: '3:46',
        node: HTMLSpanElement {},
        ariala: '3 minutes, 46 seconds'
    }, {
        order: 139,
        title: 'Blackview BV9900 PREVIEW: 48MP Quad Camera Rugged Phone 2019!',
        href: '/watch?v=Y88X2L6ms_E',
        nature: 'video',
        node: HTMLAnchorElement {},
        ariala: 'Blackview BV9900 PREVIEW: 48MP Quad Camera Rugged Phone 2019! ' +
            'by Tech Brothers 6 months ago 3 minutes, 46 seconds 20,002 ' +
            'views'
    }, {
        order: 142,
        nature: 'author',
        href: '/channel/UCU4xqrR6oX1FTggJ8bVRWhQ',
        node: HTMLAnchorElement {},
        ariala: 'Go to channel'
    }                                                                                     */
    const searchOutput = _.map(foundVideos, function(video, priorityOrder) {
        let expectedDurationOrder = (video.order - 1);
        let expectedChannelOrder = (video.order + 3);
        let duration = fuzzyFind(nodes, 'duration', expectedDurationOrder);
        let channel = fuzzyFind(nodes, 'author', expectedChannelOrder);
        let uinfo = url.parse(video.href);
        let params = qustr.parse(uinfo.query);
        let retval = {
            publicKey: e.publicKey,
            clang: uxInfo.locale,
            savingTime: new Date(e.savingTime),
            metadataId: e.metadataId,
            videoId: params.v,
            title: video.title,
            priorityOrder,
            searchTerms,
            id: utils.hash({metadataId: e.metadataId, searchTerms, publicKey: e.publicKey, priorityOrder}),
        };
        _.unset(params, 'v');
        if(_.size(params))
            _.size(retval, 'params', params);

        if(duration) {
            const { authorName, mined } = dissectAndParseLabel(video.ariala, video.title, duration.ariala, uxInfo);
            retval.selectedAuthor = authorName;
            retval.displayLength = duration.displayLength;
            retval.relativeSeconds = mined ? mined.timeago.asSeconds() : null;
            retval.currentViews = mined ? mined.views : null;
        }

        if(retval.relativeSeconds) {
            const whenCirca = moment(e.clientTime).subtract(retval.relativeSeconds);
            retval.publicationTime = new Date(whenCirca.toISOString());
        }

        /* duration or dissectAndParseLabel might fail, this is the double check */
        const doubleCheck = ['selectedAuthor', 'displayLength', 'relativeSeconds', 'currentViews', 'publicationTime'];
        _.each(doubleCheck, function(k) {
            if(!_.get(retval, k))
                retval.incomplete = true;
        })

        if(channel)
            retval.selectedChannel = channel.href;

        return retval;
    });

    debug("%d) Successfully processed %d nodes from\t%s, foundVideos %d, incomplete %j",
        i, _.size(e.acquired), e.metadataId, _.size(foundVideos),
        _.countBy(searchOutput, 'incomplete'));

    return searchOutput;
}

async function fetchAndAnalyze(labelFilter) {
    /* this is the begin of the label parser pipeline, labelFilter contains a shifting savingTime to take
     * the oldest before and the most recent later. It is meant to constantly monitoring 'labels' for the new one */

    const labels = await automo.getLastLabels(labelFilter, skipCount, htmlAmount);
    if(!_.size(labels.content)) {

        nodatacounter++;
        if( (nodatacounter % 10) == 1)
            debug("%d no data at the last query: %j", nodatacounter, labelFilter);

        lastExecution = moment().subtract(2, 'm').toISOString();
        computedFrequency = FREQUENCY;
        return;
    } else {
        computedFrequency = 0.01;
    }

    if(!labels.overflow) {
        lastExecution = moment().toISOString();
        /* 1 minute is the average stop, so it comeback to check 3 minutes before */
        overflowReport("<NOT>\t\t%d documents", _.size(labels.content));
    }
    else {
        lastExecution = moment(_.last(labels.content).savingTime);
        const mago = _.round(moment.duration( moment() - moment(_.last(labels.content).savingTime)).asMinutes(), 1);
        overflowReport("first %s [mago %d] (on %d) <window of %d minutes> next filter set to %s",
            _.first(labels.content).savingTime, mago, _.size(labels.content),
            _.round(moment.duration(
                moment(_.last(labels.content).savingTime ) - moment(_.first(labels.content).savingTime )
            ).asMinutes(), 1),
            lastExecution);
    }

    if(stats.currentamount || stats.lastamount)
        debug("[+] %d start a new cicle, %d took: %s and now process %d htmls",
            processedCounter,
            stats.currentamount, moment.duration(moment() - stats.current).humanize(),
            _.size(labels.content));
    stats.last = stats.current;
    stats.current = moment();
    stats.lastamount = stats.currentamount;
    stats.currentamount = _.size(labels.content);

    const products = _.map(labels.content, processSearches);
    /* analysis is a list with [ [ video1@searchX, video2@searchX ], null, [ videos@searchY ] ] or 'null' this is why we need to compact asap */
    const effective = _.flatten(_.compact(products));
    debug("Processed %d entries, effective searches %d, total searches video entry %d",
        _.size(labels.content), _.size(_.compact(products)), _.size(effective))

    if(_.size(effective)) {
        const queries = _.map(_.groupBy(effective, 'metadataId'), function(pelist, metadataId) {
            return {
                id: metadataId,
                searchTerms: _.first(pelist).searchTerms,
                savingTime: _.first(pelist).savingTime,
                clang: _.first(pelist).clang,
                publicKey: _.first(pelist).publicKey,
                results: _.size(pelist),
            }
        });
        const queriesWritten = await automo.upsertSearchResults(queries, nconf.get('schema').queries);
        const unCheckedRetVal = await automo.upsertSearchResults(effective, nconf.get('schema').searches);
        debug("%d completed, took %d secs = %d mins [ %d Qs - %d RESs ]",
            processedCounter, moment.duration(moment() - stats.current).asSeconds(),
            _.round(moment.duration(moment() - stats.current).asMinutes(), 2),
            queriesWritten, unCheckedRetVal
        );
    }
}

// this function is duplicated with bin/parserv2.js -- might be generalized
async function appendLabelError(currentList, lastSentAmount) {
    // pick the last appended errors 
    const newerrors = currentList.slice( currentList.length - lastSentAmount );
    return _.map(newerrors, async function(le) {
        try {
            await automo.write(nconf.get('schema').errors, {
                type: 'longlabel',
                from: 'parserv',
                when: new Date(),
                label: le,
                id: utils.hash({labelerror: le})
            });
            return true;
        } catch(error) {
            debuge("appendLabelError: Unable to write on collection 'errors': %s", error.message);
            return false;
        }
    });
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
                debug("Targeting a specific metadataId");
                labelFilter = {
                    metadataId: id
                }
            }
            if(stop && stop <= processedCounter) {
                console.log("Reached configured limit of ", stop, "( processed:", processedCounter, ")");
                process.exit(processedCounter);
            }

            await fetchAndAnalyze(labelFilter);

            if(_.size(longlabel.unrecognized) && _.size(longlabel.unrecognized) > lastErrorAmount )  {
                let tmpr = await appendLabelError(longlabel.unrecognized, lastErrorAmount);
                debuge("Appended last errors in longlabel: %s (%j)",
                    _.last(longlabel.unrecognized), tmpr);
                lastErrorAmount = _.size(longlabel.unrecognized);
            }
        }
        catch(e) {
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
    if(filter && id)
        throw new Error("Invalid combo, you can't use --filter and --id");

    if( id && (skipCount || (htmlAmount != AMOUNT_DEFAULT) ) ) {
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
    console.log("Error in wrapperLoop", e.message);
}
