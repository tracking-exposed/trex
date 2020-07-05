const _ = require('lodash');
const url = require('url');
const moment = require('moment');
const querystring = require('querystring');
const debug = require('debug')('parser:video');
const debuge = require('debug')('parser:video:error');
const debugCheckup = require('debug')('parser:C');
const debugTimef = require('debug')('parser:timeF');

const utils = require('../lib/utils'); // this because parseLikes is an utils to be used also with version of the DB without the converted like. but should be a parsing related-only library once the issue with DB version is solved
const uxlang = require('./uxlang');
const longlabel = require('./longlabel');
const shared = require('./shared');

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

function closestForTime(e, sele) {
    /* this function is a kind of .closest but apply to textContent and aria-label
       to find the right element */

    /* debug("(e) %j\n<- %j",
        _.map ( e.querySelectorAll('[href]'), function(x) { return x.getAttribute('href') }),
        _.map ( e.querySelectorAll('*'), 'textContent')
    ); */
    const combo = _.compact(_.map(e.querySelectorAll('[aria-label]'), function(x) {
        const label =  x.getAttribute('aria-label');
        const text =  x.textContent;
        /* label[0] == text[0] can't work because of "40 секунд" fails with "0:40"  */
        return ( !!label.match(/^(\d+).*/) && !!text.match(/^(\d+):(\d+).*/) ) ? { label, text } : null;
    }));

    if(_.first(combo)) {
        const expandedTime = _.first(combo).label;  // '3:02'
        const displayTime = _.first(combo).text;    // '3 minutes, 2 seconds'
        return { displayTime, expandedTime };
    }

    if(_.size(e.parentNode.outerHTML) > 9000) {
        // debugTimef("[display/extended Time] breaking recursion, next would be %d bytes", _.size(e.parentNode.outerHTML));
        return { displayTime: null, expandedTime: null };
    }

    // debugTimef("[display/extended Time] recursion (%d next %d)", _.size(e.outerHTML), _.size(e.parentNode.outerHTML) );
    return closestForTime(e.parentNode, null);
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

    const link = e.querySelector('a') ? e.querySelector('a').getAttribute('href') : null;
    const urlinfo = url.parse(link);
    const p = querystring.parse(urlinfo.query);
    const videoId = p.v;
    const liveBadge = !!e.querySelector(".badge-style-type-live-now");
    const thumbnailHref = shared.getThumbNailHref(e);

    const { displayTime, expandedTime } = closestForTime(e, '.ytd-thumbnail-overlay-time-status-renderer');
    // 2:03  -  2 minutes and 3 seconds, they might be null.
    const recommendedLength = displayTime ? moment.duration(displayTime).asSeconds() : null;
    const arialabel = e.querySelector('#video-title').getAttribute('aria-label');
    // Beastie Boys - Sabotage by BeastieBoys 9 years ago 3 minutes, 2 seconds 62,992,821 views

    if(!arialabel)
        return null;

    try {
        mined = arialabel ? longlabel.parser(arialabel, source, liveBadge): null;
        if(mined.title != title) {
            debug("Interesting anomaly: %s != %s", mined.title, title);
        }
    } catch(e) {
        debuge("longlabel parser error: %s", e.message);
    }

    /* estimate live also by missing metadata but presence of certain few */
    const estimatedLive = (!displayTime && !expandedTime && !recommendedLength && mined.timeago && mined.views) ? true : false;

    const r = {
        index: i + 1,
        verified,
        foryou,
        videoId,
        params: p,
        recommendedSource: source,
        recommendedTitle: mined ? mined.title : (title ? title : null),
        recommendedLength,
        recommendedDisplayL: displayTime ? displayTime : null,
        recommendedLengthText: expandedTime ? expandedTime : null,
        recommendedPubTime: mined ? mined.timeago : null,
        /* ^^^^  is deleted in makeAbsolutePublicationTime, when clientTime is available,
         * this field produces -> recommendedPubtime and ptPrecison */
        recommendedRelativeSeconds: mined ? mined.timeago.asSeconds() : null,
        recommendedViews: mined ? mined.views : null,
        recommendedThumbnail: thumbnailHref,
        isLive: (estimatedLive || liveBadge),
        label: arialabel,
    };
    checkUpDebug(r);
    return r;
};

function checkUpDebug(r) {
    const liveSpecialFields = [ 'displayTime', 'expandedTime', 'recommendedLength' ];
    /* this is a friendly debug line to help summarize */
    const first = _.reduce(r, function(memo, v, k) {
        if(_.isNull(v)) {
            memo.acc.push(k);
            if(liveSpecialFields.indexOf(k) !== -1)
                memo.livecombo++;
            memo.cnt++;
        }
        if(_.isNull(v))
            _.unset(r, k);

        return memo;
    }, { acc: [], cnt: 0, livecombo: 0 });

    let second = []
    if(_.size(first.acc) >= 3 && first.livecombo == 3) {
        second = _.reject(first.acc, liveSpecialFields);
    } else
        second = first.acc;

    let debstr = _.times(second, function(k) { return "!"+k; }).join('') + "";

    if(_.size(debstr))
        debugCheckup("%s\n\t%d\t%s", debstr, r.index, r.label);
};

function makeAbsolutePublicationTime(list, clientTime) {
    /* this function is call before video.js and home.js return their 
       metadata. clientTime isn't visibile in parsing function so the relative
       transformation of '1 month ago', is now a moment.duration() object 
       and now is saved the estimated ISODate format. */
    return _.map(list, function(r) {
        if(!clientTime || !r.recommendedPubTime) {
            r.publicationTime = null;
            r.timePrecision = 'error';
        } else {
            const when = moment(clientTime).subtract(r.recommendedPubTime);
            r.publicationTime = new Date(when.toISOString());
            r.timePrecision = 'estimated';
        }
        /* we are keeping 'label' so it can be fetch in mongodb but filtered in JSON/CSV */
        return _.omit(r, [ 'recommendedPubTime' ]);
    })
}

function parseSingleTry(D, memo, spec) {
    const elems = D.querySelectorAll(spec.selector);

    if(!_.size(elems)) {
        debuge("zero element selected: %s fail", spec.name);
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
    if(_.size(as) == 1 || _.size(as) == 0)
        return null;

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

function processVideo(D, blang, clientTime, urlinfo) {

    /* this is the title of the view video, the related are mined in 'relatedMetadata' */
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
    if(check != 1) debuge("unexpected thing");

    let authorName, authorSource = null;
    const authorinfo = mineAuthorInfo(D);
    if(authorinfo) {
        authorName = authorinfo.authorName;
        authorSource = authorinfo.authorSource;
    } else {
        throw new Error("lack of mandatory HTML snippet!");
    }

    const { publicationTime, publicationString, ifLang } = uxlang.sequenceForPublicationTime(D, blang, clientTime);

    let related = [];
    try {
        // debug("related videos to be looked at: %d", _.size(D.querySelectorAll('ytd-compact-video-renderer')));
        related = _.map(D.querySelectorAll('ytd-compact-video-renderer'), relatedMetadata);
    } catch(error) {
        throw new Error(`Unable to mine related: ${error.message}, ${error.stack.substr(0, 220)}...`);
    }

    debug("Video <%s> attempted to parse %d related, found actually %d < isLive %j >",
        title, _.size(related), _.size(_.compact(related)), _.countBy(related, 'isLive'));
    related = makeAbsolutePublicationTime(_.compact(related), clientTime);

    /* non mandatory info */
    let viewInfo, likeInfo = null;
    try {
        viewInfo = parseViews(D);
        likeInfo = parseLikes(D);
        const numeredInteractions = utils.parseLikes(likeInfo);
        likeInfo.watchedLikes = numeredInteractions.watchedLikes;
        likeInfo.watchedDislikes = numeredInteractions.watchedDislikes;
    } catch(error) {
        debuge("viewInfo and linkInfo not available");
    }

    let login = -1;
    try {
        login = shared.logged(D);
        /* if login is null, it means failed check */
    } catch(error) {
        debuge("Failure in logged(): %s", error.message);
        login = null;
    }

    const params = querystring.parse(urlinfo.query);
    const videoId = params.v;

    return {
        title,
        type: 'video',
        params,
        videoId,
        login,
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
            envelop.impression.clientTime,
            urlinfo,
        );
    } catch(e) {
        debuge("Error in video.process %s (%d): %s\n\t-> %s",
            envelop.impression.href, envelop.impression.size, e.message, e.stack.split('\n')[1]);
        return null;
    }

    const re = _.filter(extracted.related, { error: true });
    stats.suberror += _.size(re);
    const ve = _.filter(extracted.viewInfo, { error: true });
    stats.suberror += _.size(ve);
    const le = _.filter(extracted.likeInfo, { error: true });
    stats.suberror += _.size(le);

    if(_.size(re)) debug("related error %s", JSON.stringify(re, undefined));
    if(_.size(ve)) debug("views error %s", JSON.stringify(ve, undefined));
    if(_.size(le)) debug("likes error %s", JSON.stringify(re, undefined));
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
        debuge("Unexpected amount of element 'a' %d", _.size(a));
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
    process,
    videoAd,
    overlay,
    adTitleChannel,
    videoTitleTop,
    closestForTime,
    checkUpDebug,
    makeAbsolutePublicationTime,
};
