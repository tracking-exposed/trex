const _ = require('lodash');
const debug = require('debug')('parser:home');
const error = require('debug')('parser:home:[E]');
const debugResults = require('debug')('home<R>');

const longlabel = require('./longlabel');
const videoparser = require('./video');

function dissectSelectedVideo(e, i, sections, offset) {
    const infos = {};

    try {
        infos.textTitle = e.querySelector('#video-title-link').textContent;
    } catch(error) {
        error("Failure in textTitle: %s\n\t%s", error.message, e.querySelector("#video-title-link").innerHTML);
        infos.error = true;
    }
    try {
        infos.href = e.querySelector('a').getAttribute('href');
    } catch(error) {
        error("Failure in href: %s\n\t%s", error.message, e.querySelector("a").innerHTML);
        infos.error = true;
    }
    try {
        infos.authorName = e.querySelector('#text-container.ytd-channel-name').querySelector('a').textContent;
    } catch(error) {
        error("Failure in authorName: %s\n\t%s", error.message, e.querySelector('#text-container.ytd-channel-name').innerHTML);
        infos.error = true;
    }
    try {
        infos.authorHref = e.querySelector('#text-container.ytd-channel-name').querySelector('a').getAttribute('href');
    } catch(error) {
        error("Failure in authorHref: %s\n\t%s", error.message, e.querySelector('#text-container.ytd-channel-name').innerHTML);
        infos.error = true;
    }
    try {
        const metadata = e.querySelector('#metadata');
        if(metadata.children.length > 0) {
            // if is verified, the keyword vary language by language, but you've always
            // TED\nVerified\n•, and this allow us a more technical check:
            infos.source = _.first(metadata.children[0].textContent.split('\n'));
            infos.verified = !!(_.size(metadata.children[0].textContent.split('\n')) > 1 );
            if(infos.source != infos.authorName)
                debug("To be investigated anomaly (n.1) %s != %s", infos.source, infos.authorName);
        }
    } catch(error) {
        error("Failure in source/verified: %s\n\t%s", error.message, e.querySelector('#metadata').innerHTML);
        infos.error = true;
    }
    try {
        const { displayTime, expandedTime } = videoparser.closestForTime(e, '.ytd-thumbnail-overlay-time-status-renderer');
        infos.displayTime = displayTime;
        infos.expandedTime = expandedTime;
    } catch(error) {
        error("Failure in displayTime|expandedTime: %s\n\t%s", error.message, e.querySelector('.ytd-thumbnail-overlay-time-status-renderer').innerHTML);
        infos.error = true;
    }
    try {
        infos.link = e.querySelectorAll('a')[0].getAttributeNode('href').value
        infos.videoId = infos.link.replace(/.*v=/, '')
        infos.parameter = infos.videoId.match(/&.*/) ? videoId.replace(/.*&/, '&') : null;
        infos.liveBadge = e.querySelector(".badge-style-type-live-now");
    } catch(e) {
        error("simple metadata parser error: %s", e.message);
    }
    try {
        infos.aria = e.querySelector('#video-title-link').getAttribute('aria-label');
        infos.mined = infos.aria ? longlabel.parser(infos.aria, infos.authorName, !!infos.liveBadge): null;
        if(infos.mined.title != infos.textTitle)
            debug("To be investigated anomaly (n.2) %s != %s", infos.mined.title, infos.textTitle);
    } catch(e) {
        error("longlabel parser error: [%s] %s",
            infos.aria ? infos.aria : "aria-label-not-avail", e.message);
    }

    try {
        infos.sectionNumber = _.size(_.filter(_.map(sections, 'offset'), function(o) {
            return _.gt(o, offset);
        }));
        infos.section = _.get(sections, infos.sectionNumber, { title: null }).title;
    } catch(e) {
        error("section calculation fail: %j %d", sections, offset);
    }
   
    const r = {
        index: i + 1,
        verified: infos.verified,
        source: infos.authorName,
        foryou: "n/a",
        videoId: infos.videoId,
        parameter: infos.parameter ? infos.parameter : null,
        sectionName: infos.section ? infos.section : null,
        recommendedSource: infos.authorName ? infos.authorName : null,
        recommendedTitle: infos.mined ? infos.mined.title : null,
        recommendedLength: infos.displayTime ? infos.displayTime : null,
        recommendedLengthSe: infos.expandedTime ? infos.expandedTime : null,
        recommendedPubTime: infos.mined ? infos.mined.timeago : null,
        recommendedRelativeSeconds: infos.mined ? infos.mined.timeago.asSeconds() : null,
        recommendedViews: infos.mined ? infos.mined.views : null,
        isLive: !!infos.liveBadge,

        /* field removed before finalizing the package for the DB */
        label: infos.aria ? infos.aria : null,
    };
    videoparser.checkUpDebug(r);
    return r;
}

function recursiveSize(e, memo) {
    const elementSize = _.size(e.outerHTML);
    const tagName = e.tagName;
    if(!tagName)
        return memo;
    const combo = elementSize + ''; // + '-' + tagName.substring(0, 5);
    if(!memo)
        return recursiveSize(e.parentNode, [ combo ]);
    memo.push(combo);
    return recursiveSize(e.parentNode, memo);
}

function actualHomeProcess(D) {

    /* selection findings */
    const titles = _.compact(_.map(D.querySelectorAll('#title'), function(e) {
        if(!_.size(e.textContent) || !_.size(_.trim(e.textContent)))
            return null;

        const splits = D.querySelector('body').outerHTML.split(e.outerHTML);
        return {
            offset: _.size(_.first(splits)),
            splits: _.size(splits),
            title: _.first(e.textContent.split("\n")),
        };
    }));
    debugResults("sections %j", titles)

    const videoElemSelector = 'ytd-rich-item-renderer';
    const ve = D.querySelectorAll(videoElemSelector);
    debug("From this homepage we'll process %d video entry", _.size(ve));
    const sizes = [];
    const selectorOffsetMap = [];
    // sizes is a debug accumulator filled as side effect below 
    const selected = _.map(ve, function(e, i) {
        sizes.push(recursiveSize(e));
        try {
            const splits = D.querySelector('body').outerHTML.split(e.outerHTML)
            const offset = _.size(_.first(splits));
            selectorOffsetMap.push({ i, offset, amount: _.size(splits)});
            let videoInfo = dissectSelectedVideo(e, i, titles, offset);
            return videoInfo;
        } catch(error) {
            const f = e.querySelector('#video-title-link');
            const s = f ? f.getAttribute('aria-label') : null;
            _.last(sizes).push({error: true, order: i + 1, label: s});
            return {
                index: i + 1,
                error: true,
                reason: error.message,
                label: s,
            }
        }
    });

    debugResults("Parsing completed, errors: %j over %d", _.countBy(selected, { error: true }), _.size(selected)); 
    _.each(sizes, function(s, i) {
        const info = _.get(selected, i);
        if(info.error)
            debugResults("%d %s\t[e] %s <%s>", info.index, JSON.stringify(s), info.reason, info.label);
        else
            debugResults("%d %s\t%s", info.index, JSON.stringify(s), info.recommendedTitle);
    });
    return _.reject(selected, { error: true });
}

function process(envelop) {

    let retval = {};
    try {
        retval.selected = actualHomeProcess(envelop.jsdom);
    } catch(e) {
        debug("Error in processing %s (%d): %s",
            envelop.impression.href, envelop.impression.size, e.message);
        return null;
    }

    retval.type = 'home';

    try {
        retval.login = videoparser.logged(envelop.jsdom);
        /* if login is null, it means failed check */
    } catch(error) {
        debug("Exception in logged(): %s", error.message);
        retval.login = null;
    }

    try {
        retval.selected = videoparser.makeAbsolutePublicationTime(retval.selected, envelop.impression.clientTime);
    } catch(error) {
        debug("this function is executed outside because clientTime don't travel in parsing function. errro: %s %s",
            error.message, error.stack);
    }
    return retval;
};

module.exports = {
    process,
};