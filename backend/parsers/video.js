const _ = require('lodash');
const url = require('url');
const moment = require('moment');
const querystring = require('querystring');
const debug = require('debug')('parser:video');
const error = require('debug')('parser:video:[E]');

const uxlang = require('./uxlang');
const longlabel = require('./longlabel');

const stats = { skipped: 0, error: 0, suberror: 0, success: 0 };

function parseViews(D) {
    const node = _.first(D.getElementsByClassName('view-count'));
    const viewStr = node.innerHTML
    let tmp = _.first(viewStr.split(' '))
    const viewNumber = _.parseInt(tmp.replace(/[.,]/g, ''));
    return { viewStr: viewStr, viewNumber: viewNumber };
};

function parseLikes(D) {
    const nodes = D.querySelectorAll('.ytd-toggle-button-renderer > yt-formatted-string');
    const likes = nodes[0].getAttribute('aria-label');
    const dislikes = nodes[1].getAttribute('aria-label');
    return { likes: likes, dislikes: dislikes };
};

function logged(D) {
    const avatarN = D.querySelectorAll('button#avatar-btn');
    const loginN = D.querySelectorAll('[href^="https://accounts.google.com/ServiceLogin"]');
    const avalen = avatarN ? avatarN.length : 0;
    const logilen = loginN ? loginN.length : 0;

    // login button | avatar button len
    if(logilen && !avalen)
        return false;
    if(avalen && !logilen)
        return true; 

    debug("Inconsistent condition avatar %d login %d", avalen, logilen);
    return null;
}

function relatedMetadata(e, i) {
    // here we find metadata inside the preview snippet on the right column
    let source, verified, vizstr, foryou, mined;
    const title = e.querySelector('#video-title').textContent;
    const metadata = e.querySelector('#metadata');

    if(metadata.children.length > 0) {
        // if is verified, the keyword vary language by language, but you've always
        // TED\nVerified\n•, and this allow us a more technical check:
        source = _.first(metadata.children[0].textContent.split('\n'));
        verified = !!(_.size(metadata.children[0].textContent.split('\n')) > 1 );
    }

    if(metadata.children.length > 1)
        vizstr = _.size(metadata.children[1].textContent) ? metadata.children[1].textContent : null;

    if(vizstr && _.size(vizstr))
        foryou = vizstr.match(/\d+/) ? false : true;

    const link = e.querySelectorAll('a')[0].getAttributeNode('href').value
    const videoId = link.replace(/.*v=/, '');
    const parameter = videoId.match(/&.*/) ? videoId.replace(/.*&/, '&') : null;
    const liveBadge = e.querySelector(".badge-style-type-live-now");

    let displayTime, expandedTime;
    if(e.querySelector('.ytd-thumbnail-overlay-time-status-renderer')) {
        displayTime = e
            .querySelector('.ytd-thumbnail-overlay-time-status-renderer')
            .textContent; // '3:02'
        expandedTime = e
            .querySelector('.ytd-thumbnail-overlay-time-status-renderer')
            .getAttribute('aria-label'); //'3 minutes, 2 seconds'
    }
    const arialabel = e.querySelector('#video-title').getAttribute('aria-label');
    // Beastie Boys - Sabotage by BeastieBoys 9 years ago 3 minutes, 2 seconds 62,992,821 views

    try {
        mined = arialabel ? longlabel.parser(arialabel, source, !!liveBadge): null;
        if(mined.title != title) {
            debug("Interesting anomaly: %s != %s", mined.title, title);
        }
    } catch(e) {
        error("longlabel parser error: %s", e.message);
    }

    // thumbnail is @ https://i.ytimg.com/vi/${videoId}/hqdefault.jpg
    const r = {
        index: i + 1,
        verified,
        source,
        foryou,
        videoId,
        parameter: parameter ? parameter : null,
        recommendedTitle: mined ? mined.title : null,
        recommendedLength: displayTime ? displayTime : null,
        recommendedLengthSe: expandedTime ? expandedTime : null,
        recommendedPubTime: mined ? mined.timeago : null,
        recommendedRelativeSeconds: mined ? mined.timeago.asSeconds() : null,
        recommendedViews: mined ? mined.views : null,
        isLive: !!liveBadge
    };
    /* this is a friendly debug line to help summarize */
    const l = _.reduce(r, function(memo, v, k) {
        if(_.isNull(v)) {
            memo.str += "!" + k;
            memo.cnt++;
        }
        return memo;
    }, { str: "", cnt: 0 });
    debug(l.cnt, l.str);
    return r;
};

function parseSingleTry(D, memo, spec) {
    const elems = D.querySelectorAll(spec.selector);

    if(!_.size(elems)) {
        error("zero element selected: %s fail", spec.name);
        return memo;
    }

    if(!spec.selected && _.size(elems) > 1) {
        debug("%s with %s gives %d elements. only the 1st kept",
            spec.name, spec.selector, _.size(elems));
    }

    if(spec.selected) {
        debug("this look like a too overcomplex framework to define scraper... %d",
            spec.selected);
    }

    const source = spec.selected ?  _.nth(elems, spec.selected) : _.first(elems);

    try {
        const candidate = source[spec.func];
        if(_.size(candidate)) {
            if(memo) {
                // debug("Not replacing [%s] with [%s] by %s", memo, candidate, spec.name);
                return memo;
            }
            return candidate;
        }
    } catch(error) {
        return memo;
    }
};

function manyTries(D, opportunities) {
    const r = _.reduce(opportunities, _.partial(parseSingleTry, D), null);
    // debug("manyTries: %j: %s", _.map(opportunities, 'name'), r);
    return r;
};


function mineAuthorInfo(D) {

    const as = D.querySelector('a.ytd-video-owner-renderer').parentNode.querySelectorAll('a');
    if(_.size(as) == 1) {
        return null;
    } else if(_.size(as) >= 2) {
        const authorName = D.querySelector('a.ytd-video-owner-renderer').parentNode.querySelectorAll('a')[1].textContent;
        const authorSource = D.querySelector('a.ytd-video-owner-renderer').parentNode.querySelectorAll('a')[0].getAttribute('href');

        if( D.querySelector('a.ytd-video-owner-renderer')
                .parentNode
                .querySelectorAll('a')[1]
                .getAttribute('href') != authorSource ) {
            debug("%s and %s should lead to the same youtube-content-page", 
                D.querySelector('a.ytd-video-owner-renderer')
                    .parentNode
                    .querySelectorAll('a')[1]
                    .getAttribute('href'), authorSource );
        }
        return { authorName, authorSource };
    } 
}

function processVideo(D, blang, clientTime) {

    const title = manyTries(D, [{
        name: 'title h1',
        selector: 'h1 > yt-formatted-string',
        expected: null,
        selected: null,
        func: 'textContent'
    }, {
        name: 'title ytp-title',
        selector: '.ytp-title',
        expected: null,
        selected: null,
        func: 'textContent'
    } ]);
    if(!title) {
        throw new Error("unable to get video title");
    }

    const check = D.querySelectorAll('a.ytd-video-owner-renderer').length; // should be 1
    const mined = mineAuthorInfo(D);
    let authorName, authorSource = null;
    if(mined) {
        authorName = mined.authorName;
        authorSource = mined.authorSource;
    } else {
        throw new Error("lack of mandatory HTML snippet!");
    }

    const { publicationTime, publicationString, ifLang } = uxlang.sequenceForPublicationTime(D, blang, clientTime);

    let related = [];
    try {
        // debug("related videos to be looked at: %d", _.size(D.querySelectorAll('ytd-compact-video-renderer')));
        related = _.map(D.querySelectorAll('ytd-compact-video-renderer'), relatedMetadata);
        related = _.map(related, function(r) {
            /* overwrite the moment.duration object with a relative duration using clientTime as pivot */
            r.recommendedPubTime = moment(clientTime).subtract(r.recommendedPubTime).toISOString();
            return r;
        });
    } catch(error) {
        throw new Error(`Unable to mine related: ${error.message}, ${error.stack.substr(0, 220)}...`);
    }

/*
    -- to be determined if deserve to be kept or not 
    if(relatedN < 20) {
        // debug("Because the related video are less than 20 (%d) trying the method2 of related extraction", relatedN);
        const f = D.querySelectorAll('[aria-label]')
        const alternativeR = _.compact(_.map(f, function(e, i) {
            if(e.parentNode.parentNode.tagName != 'DIV' || e.parentNode.tagName != 'H3')
                return null;

            var t = e.parentNode.parentNode.parentNode.parentNode.querySelector("#thumbnail");

            if(t) {
                e.parentNode.parentNode.loaded = true;
                return e.parentNode.parentNode;
            }
            else {
                e.parentNode.parentNode.loaded = false;
                return null; 
                // > _.countBy(selected, {loaded: true })
                // { true: 24, false: 25 }
                //  --- the videos not yet loaded but potentially suggested
            }

        }));

        if(_.size(alternativeR) > _.size(related)) {
            debug("Extending/Overwritting %d related with %d findings, partially loaded (%j)",
                _.size(related), _.size(alternativeR), _.countBy(alternativeR, { loaded: true}));
            related = _.map(alternativeR, relatedMetadata);
        }
    }
*/

    debug("Video <%s> mined %d related", title, _.size(related));

    /* non mandatory info */
    let viewInfo, likeInfo = null;
    try {
        viewInfo = parseViews(D);
        likeInfo = parseLikes(D);
    } catch(error) {
        error("viewInfo and linkInfo not available");
    }

    let login = -1;
    try {
        login = logged(D);
        /* if login is null, it means failed check */
    } catch(error) {
        error("Failure in logged(): %s", error.message);
        login = null;
    }

    return {
        title,
        login,
        check,
        publicationString,
        publicationTime,
        blang: blang ? blang : ifLang,
        authorName,
        authorSource,
        related,
        viewInfo,
        likeInfo
    };
};

function process(envelop) {

    const urlinfo = url.parse(envelop.impression.href);
    if(urlinfo.pathname != '/watch') {
        debug("SKIP 'non-video' page [%s]", envelop.impression.href);
        return null;
    }

    let extracted = null;
    try {
        extracted = processVideo(
            envelop.jsdom,
            envelop.impression.blang,
            envelop.impression.clientTime
        );
    } catch(e) {
        error("Error in video.process %s (%d): %s\n%s",
            envelop.impression.href, envelop.impression.size, e.message, e.stack);
        return null;
    }

    extracted.type = 'video';
    extracted.params = querystring.parse(urlinfo.query);
    extracted.videoId = extracted.params.v;

    const re = _.filter(extracted.related, { error: true });
    stats.suberror += _.size(re);
    const ve = _.filter(extracted.viewInfo, { error: true });
    stats.suberror += _.size(ve);
    const le = _.filter(extracted.likeInfo, { error: true });
    stats.suberror += _.size(le);

    if(_.size(re)) debug("related error %s", JSON.stringify(re, undefined));
    if(_.size(ve)) debug("views error %s", JSON.stringify(ve, undefined));
    if(_.size(le)) debug("likes error %s", JSON.stringify(re, undefined));

    /* remove debugging/research fields we don't want in mongo */
    _.unset(extracted, 'check');
    return extracted;
};

function videoAd(envelop) { 
    if ( envelop.impression.size == 58 ) {
        return null;
    }
    if(!envelop.jsdom.querySelector('.ytp-ad-text'))
        return null;

    let candidate1 = envelop.jsdom.querySelector('.ytp-ad-text');
    let candidate2 = envelop.jsdom.querySelector('.ytp-ad-button-text'); // it might be 'Play for free' or sth

    if(candidate1 && _.size(candidate1.textContent))
        return { adLabel: candidate1.textContent };
    else if (candidate2 && _.size(candidate2.textContent))
        return { adLabel: candidate2.textContent };
    else
        return null;
}
function overlay(envelop) {
    if(
        (envelop.jsdom.querySelector('body').outerHTML).length == 71 &&
         envelop.impression.size == 58 ) {
        debug("Fairly strict (undocumented) condition to ignore overlay matches");
        return null;
    }

    const adbuyer = envelop.jsdom.querySelector('.ytp-ad-visit-advertiser-button').textContent;
    if(!adbuyer)
        return null;

    return { 'adLink': adbuyer };
}
function adTitleChannel(envelop) {
    const D = envelop.jsdom;
    const a = D.querySelectorAll('a');
    if(_.size(a) != 2)
        error("Unexpected amount of element 'a' %d", _.size(a));
    if(!a[0].getAttribute('href'))
        return null;
    return {
        adChannel: a[0].getAttribute('href'),
        adLabel: a[0].getAttribute('aria-label'),
    };
}
function videoTitleTop(envelop, selector) {
    const D = envelop.jsdom;
    const as = D.querySelectorAll('a');
    let adLabel, adChannel = null;

    if(_.size(as) > 3) {
        if( !_.size(as[1].textContent) && 
             _.size(as[1].getAttribute('href')) > _.size("https://www.youtube.com/") )
            adChannel = as[1].getAttribute('href');

        if( _.size(as[2].textContent) > 3 /* 'ads' */ && !as[2].getAttribute('href')) 
            adLabel = as[2].textContent;
    }

    if(adLabel && adChannel) {
        return { adLabel, adChannel };
    }
    return null;
}


module.exports = {
    logged,
    process,
    videoAd,
    overlay,
    adTitleChannel,
    videoTitleTop,
};
