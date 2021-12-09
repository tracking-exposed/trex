const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('parser:home');
const debuge = require('debug')('parser:home:error');
const debugw = require('debug')('parser:home:warning');

const shared = require('./shared');
const longlabel = require('./longlabel');
const uxlang = require('./uxlang');
const videoparser = require('./video');

function dissectSelectedVideo(e, i, sections, offset) {
    const infos = {};
    const errorLog = [];

    try {
        infos.textTitle = e.querySelector('#video-title-link').textContent;
    } catch(error) {
        errorLog.push("Failure in textTitle: " + error.message);
        infos.error = true;
    }
    try {
        infos.href = e.querySelector('a').getAttribute('href');
    } catch(error) {
        errorLog.push("Failure in href: " + error.message);
        infos.error = true;
    }
    try {
        infos.authorName = e.querySelector('#text-container.ytd-channel-name').querySelector('a').textContent;
    } catch(error) {
        errorLog.push("Failure in authorName: " + error.message);
        infos.error = true;
    }
    try {
        infos.authorHref = e.querySelector('#text-container.ytd-channel-name').querySelector('a').getAttribute('href');
    } catch(error) {
        errorLog.push("Failure in authorHref: " + error.message);
        infos.error = true;
    }
    try {
        const metadata = e.querySelector('#metadata');
        if(metadata.children.length > 0) {
            // if is verified, the keyword vary language by language, but you've always
            // TED\nVerified\n•, and this allow us a more technical check:
            infos.source = _.first(metadata.children[0].textContent.split('\n'));
            infos.verified = !!(_.size(metadata.children[0].textContent.split('\n')) > 1 );
            if(infos.source && infos.authorName && infos.source !== infos.authorName) {
                // debugw("To be investigated anomaly n.1 [%s]!=[%s]", infos.source, infos.authorName);

                // this is interesting but .source isn't used and it is the one appearing duplicated
            }
        }
    } catch(error) {
        errorLog.push("Failure in source/verified: " + error.message);
        infos.error = true;
    }
    try {
        const { displayTime, expandedTime } = videoparser.closestForTime(e, '.ytd-thumbnail-overlay-time-status-renderer');
        infos.displayTime = displayTime;
        infos.expandedTime = expandedTime;
        infos.recommendedLength = displayTime ? moment.duration(shared.fixHumanizedTime(displayTime)).asSeconds() : -1;
    } catch(error) {
        errorLog.push("Failure in displayTime|expandedTime: " + error.message);
        infos.error = true;
    }
    try {
        infos.link = e.querySelector('a') ? e.querySelector('a').getAttribute('href') : null;
        infos.videoId = infos.link.replace(/.*v=/, '');
        infos.parameter = infos.videoId.match(/&.*/) ? infos.videoId.replace(/.*&/, '&') : null;
        infos.liveBadge = !!e.querySelector(".badge-style-type-live-now");
    } catch(e) {
        errorLog.push("simple metadata parser error: " + e.message);
    }
    try {
        infos.aria = e.querySelector('#video-title-link').getAttribute('aria-label');
        infos.mined = infos.aria ? longlabel.parser(infos.aria, infos.authorName, infos.liveBadge): null;
        if(infos.mined.title && infos.textTitle && infos.mined.title !== infos.textTitle)
            debugw("To be investigated anomaly n.2 [%s]!=[%s]", infos.mined.title, infos.textTitle);
    } catch(e) {
        errorLog.push("longlabel parser error: " +
            infos.aria ? infos.aria : "[aria-label-not-avail]" + " " +
            e.message);
    }

    try {
        infos.sectionNumber = _.size(_.filter(_.map(sections, 'offset'), function(o) {
            return _.gt(o, offset);
        }));
        infos.section = _.get(sections, infos.sectionNumber, { title: null }).title;
    } catch(e) {
        errorLog.push("Section calculation fail: " + JSON.stringify(sections) + "offset" + offset);
    }

    /* if(_.size(_.compact(errorLog)))
        debuge("Video order %d got %d errors [elemSize %d]: %j",
            i, _.size(_.compact(errorLog)), _.size(e.outerHTML), _.compact(errorLog ));
     */

    if(!infos.aria)
        return null;

    const s = {
        index: i + 1,
        verified: infos.verified,
        videoId: infos.videoId,
        parameter: infos.parameter ? infos.parameter : null,
        sectionName: infos.section ? infos.section : null,
        recommendedSource: infos.authorName ? infos.authorName : null,
        recommendedHref: infos.authorHref ? infos.authorHref: null,
        recommendedTitle: infos.mined ? infos.mined.title : null,
        recommendedLength: infos.recommendedLength,
        recommendedDisplayL: infos.displayTime ? infos.displayTime : null,
        recommendedLengthText: infos.expandedTime ? infos.expandedTime : null,
        recommendedPubTime: infos.mined ? infos.mined.timeago : null,
        /* ^^^^  is deleted in makeAbsolutePublicationTime, when clientTime is available,
         * this field produces -> recommendedPubtime and ptPrecison */
        recommendedRelativeSeconds: infos.mined ? infos.mined.timeago.asSeconds() : null,
        recommendedViews: infos.mined ? infos.mined.views : null,
        isLive: !!infos.liveBadge,
        label: infos.aria ? infos.aria : null,
        elems: _.size(e.outerHTML)
    };
    videoparser.checkUpDebug(s);
    return s;
}

/* Size tree special debug method. This is quite CPU intensive therefore should be 
 * enabled only by explicitly patching the variable below */
const RECURSIZE_SIZE_ENABLED = false;
function recursiveSize(e, memo) {
    if(!RECURSIZE_SIZE_ENABLED) {
        // eslint-disable-next-line
        console.log("function shouldn't be invoked"); return null;
    }
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
let sizes = [];
function sizeTreeResearch(e, i) {
    if(!RECURSIZE_SIZE_ENABLED) return;
    if(!i)
        sizes = [];
    sizes.push(recursiveSize(e));
}
function debugSizes(selected) {
    if(!RECURSIZE_SIZE_ENABLED) return;
    _.each(sizes, function(s, i) {
        const info = _.get(selected, i);
        if(info.error)
            debugw("%d %s\t[e] %s <%s>", info.index, JSON.stringify(s), info.reason, info.label);
        else
            debugw("%d %s\t%s", info.index, JSON.stringify(s), info.recommendedTitle);
    });
}
/* ********* end of 'size' related code ********* */

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
    debugw("sections %j", titles)

    const videoElemSelector = 'ytd-rich-item-renderer';
    const ve = D.querySelectorAll(videoElemSelector);

    debug("From this homepage we'll process %d video entry", _.size(ve));
    const selectorOffsetMap = [];
    /* this collection is only useful to study the page, and it is saved in the DB */
    const selected = _.map(ve, function(e, i) {
        /* this research is interesting but not yet used */
        sizeTreeResearch(e, i)
        const thumbnailHref = shared.getThumbNailHref(e);
        try {
            const ubication = D.querySelector('body').outerHTML.indexOf(e.outerHTML);
            selectorOffsetMap.push({ i, offset: ubication });
            const videoInfo = dissectSelectedVideo(e, i, titles, ubication);
            videoInfo.thumbnailHref = thumbnailHref;
            return videoInfo;
        } catch(error) {
            const f = e.querySelector('#video-title-link');
            const s = f ? f.getAttribute('aria-label') : null;
            return {
                index: i + 1,
                error: true,
                reason: error.message,
                label: s,
                thumbnailHref
            }
        }
    });
    const effective = _.reject(selected, { error: true });
    debugw("Parsing completed. Analyzed %d, effective %d", _.size(selected), _.size(effective));
    debugSizes(effective);
    return { selected: effective, sections: selectorOffsetMap };
    /* sections would be removed before being saved in mongodb */
}

function guessUXlanguage(D) {
    const buttons = D.querySelectorAll('button');
    const localizedStrings = _.compact(_.map(buttons, function(e) { return e.textContent.trim(); } ));
    /* note, home and video seems to share the same pattern */
    return uxlang.findLanguage('video', localizedStrings);
}

function process(envelop) {

    const retval = {};
    try {
        const { selected, sections } = actualHomeProcess(envelop.jsdom);
        retval.selected = selected;
        retval.sections = sections;
    } catch(e) {
        debuge("Error in processing %s (%d): %s",
            envelop.impression.href, envelop.impression.size, e.message);
        return null;
    }

    retval.type = 'home';
    retval.blang = guessUXlanguage(envelop.jsdom);

    try {
        retval.login = shared.logged(envelop.jsdom);
        /* if login is null, it means failed check */
    } catch(error) {
        debuge("Exception in logged(): %s", error.message);
        retval.login = null;
    }

    try {
        retval.selected = videoparser.makeAbsolutePublicationTime(retval.selected, envelop.impression.clientTime);
    } catch(error) {
        debuge("this function is executed outside because clientTime don't travel in parsing function. error: %s %s",
            error.message, error.stack);
    }
    return retval;
};

module.exports = {
    process,
};