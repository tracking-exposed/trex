const _ = require('lodash');
const url = require('url');
const moment = require('moment');
const querystring = require('querystring');
const debug = require('debug')('parser:video');
const debuge = require('debug')('parser:video:error');
const debugCheckup = require('debug')('parser:C');

const utils = require('../lib/utils'); // this because parseLikes is an utils to be used also with version of the DB without the converted like. but should be a parsing related-only library once the issue with DB version is solved
const uxlang = require('./uxlang');
const longlabel = require('./longlabel');
const shared = require('./shared');

const stats = { skipped: 0, error: 0, suberror: 0, success: 0 };

function parseViews(D) {
    const node = _.first(D.getElementsByClassName('view-count'));
    const viewStr = node.innerHTML
    const tmp = _.first(viewStr.split(' '))
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
        const expandedTime = _.first(combo).label.trim();  // '3:02'
        const displayTime = _.first(combo).text.trim();    // '3 minutes, 2 seconds'
        return { displayTime, expandedTime };
    }

    if(_.size(e.parentNode.outerHTML) > 9000) {
        // debugTimef("[display/extended Time] breaking recursion, next would be %d bytes", _.size(e.parentNode.outerHTML));
        return { displayTime: null, expandedTime: null };
    }

    // debugTimef("[display/extended Time] recursion (%d next %d)", _.size(e.outerHTML), _.size(e.parentNode.outerHTML) );
    return closestForTime(e.parentNode, null);
}

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
    if(_.size(first.acc) >= 3 && first.livecombo === 3) {
        second = _.reject(first.acc, liveSpecialFields);
    } else
        second = first.acc;

    const debstr = _.times(second, function(k) { return "!"+k; }).join('') + "";

    if(_.size(debstr))
        debugCheckup("%s\n\t%d\t%s", debstr, r.index, r.label);
};

function relatedMetadata(e, i) {
    // here we find metadata inside the preview snippet on the right column
    let foryou, mined;
    const title = e.querySelector('#video-title').textContent;
    const metadata = e.querySelector('#metadata');

    const verified = !!metadata.querySelector('svg');
    const source = metadata.querySelector("yt-formatted-string").textContent;

    const link = e.querySelector('a') ? e.querySelector('a').getAttribute('href') : null;
    // eslint-disable-next-line node/no-deprecated-api
    const urlinfo = url.parse(link);
    const p = querystring.parse(urlinfo.query);
    const videoId = p.v;
    const liveBadge = !!e.querySelector(".badge-style-type-live-now");
    const thumbnailHref = shared.getThumbNailHref(e);

    const { displayTime, expandedTime } = closestForTime(e, '.ytd-thumbnail-overlay-time-status-renderer');
    // 2:03  -  2 minutes and 3 seconds, they might be null.
    const recommendedLength = displayTime ? moment.duration(shared.fixHumanizedTime(displayTime)).asSeconds() : null;
    const arialabel = e.querySelector('#video-title').getAttribute('aria-label');
    // Beastie Boys - Sabotage by BeastieBoys 9 years ago 3 minutes, 2 seconds 62,992,821 views

    if(!arialabel)
        return null;

    try {
        mined = arialabel ? longlabel.parser(arialabel, source, liveBadge): null;
        if(mined.title !== title) {
            debug("Interesting anomaly: %s != %s", mined.title, title);
        }
    } catch(e) {
        debuge("longlabel parser error: %s", e.message);
    }

    /* estimate live also by missing metadata but presence of certain few */
    const estimatedLive = function() {
        if(mined && mined.isLive) return true;
        return !!((!displayTime && !expandedTime && !recommendedLength));
    }();

    const r = {
        index: i + 1,
        verified,
        foryou,
        videoId,
        params: p,
        recommendedSource: source,
        recommendedTitle: mined ? mined.title : (title || null),
        recommendedLength,
        recommendedDisplayL: displayTime || null,
        recommendedLengthText: expandedTime || null,
        recommendedPubTime: estimatedLive ? null : (mined ? mined.timeago : null),
        /* ^^^^  is deleted in makeAbsolutePublicationTime, when clientTime is available,
         * this field produces -> recommendedPubtime and ptPrecison */
        recommendedRelativeSeconds: estimatedLive ? null : ( mined ? mined.timeago.asSeconds() : null),
        recommendedViews: mined ? mined.views : null,
        recommendedThumbnail: thumbnailHref,
        isLive: (estimatedLive || liveBadge),
        label: arialabel,
    };
    checkUpDebug(r);
    return r;
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
        // debuge("zero element selected: %s fail", spec.name);
        return memo;
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
    if(_.size(as) === 1 || _.size(as) === 0)
        return null;

    const authorName = D.querySelector('a.ytd-video-owner-renderer').parentNode.querySelectorAll('a')[1].textContent;
    const authorSource = D.querySelector('a.ytd-video-owner-renderer').parentNode.querySelectorAll('a')[0].getAttribute('href');

    if( D.querySelector('a.ytd-video-owner-renderer')
            .parentNode
            .querySelectorAll('a')[1]
            .getAttribute('href') !== authorSource ) {
        debug("%s and %s should lead to the same youtube-content-page", 
            D.querySelector('a.ytd-video-owner-renderer')
                .parentNode
                .querySelectorAll('a')[1]
                .getAttribute('href'), authorSource );
    }
    return { authorName, authorSource };
}

function simpleTitlePicker(D) {
    return _.reduce(D.querySelectorAll('h1'), function(memo, ne) {
        if(memo)
            return memo;
        if(ne.textContent.length)
            memo = ne.textContent;
        return memo;
    }, null);
}

function processVideo(D, blang, clientTime, urlinfo) {

    /* this method to extract title was a nice experiment 
     * and/but should be refactored and upgraded */
    let title = manyTries(D, [{
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
    if(!title)
        title = simpleTitlePicker(D);

    if(!title) {
        throw new Error("unable to get video title");
    }

    /*
    const check = D
        .querySelectorAll('ytd-channel-name.ytd-video-owner-renderer')
        .length;
    if(check != 2)
        debuge("unexpected condition in channel/author mining, should be 2, is %d", check);
    */

    let authorName; let authorSource = null;
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

    debug("Video <%s> has %d recommended (found %d, live %j)",
        title,
        _.size(related),
        _.size(_.compact(related)),
        _.countBy(related, 'isLive')
    );
    related = makeAbsolutePublicationTime(_.compact(related), clientTime);

    /* non mandatory info */
    let viewInfo; let likeInfo = null;
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
        blang: blang || ifLang,
        authorName,
        authorSource,
        related,
        viewInfo,
        likeInfo
    };
};

function process(envelop) {

    let extracted = null;
    try {
        extracted = processVideo(
            envelop.jsdom,
            envelop.impression.blang,
            envelop.impression.clientTime,
            // eslint-disable-next-line node/no-deprecated-api
            url.parse(envelop.impression.href),
        );
    } catch(e) {
        debuge("Error in video.process %s (%j): %s\n\t-> %s",
            envelop.impression.href, envelop.impression.nature, e.message, e.stack.split('\n')[1]);
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

module.exports = {
    process,
    closestForTime,
    checkUpDebug,
    makeAbsolutePublicationTime,
};
