const _ = require('lodash');
const debuge = require('debug')('parser:searches:error');

const longlabel = require('./longlabel');

function findSection(video) {
    // go up till a ytd-shelf-renderer
    // don't go further a ytd-item-section-renderer
    let sectionName = "Search results";
    _.reduce(_.times(5), function(memo) {
        if(memo.parentNode.tagName === _.toUpper("ytd-item-section-renderer"))
            return memo;
        memo = memo.parentNode;
        const h2 = memo.firstElementChild.querySelector('h2');
        if(h2) {
            // check any form of consistency 
            if(h2.querySelector('.ytd-shelf-renderer'))
                sectionName = h2.textContent;
        }
        return memo;
    }, video);
    return sectionName;
}

function dissectVideoAndParents(video, i) {
    // <ytd-video-renderer> element 
    const position = i + 1;
    const thuhref = video.querySelector('a#thumbnail');
    const href = thuhref.getAttribute('href');
    if(href.length !== 20)
        debuge("Not a standard direct link? %s in position %d", href, position);
 
    const videoId = href.substr(9);
    const authorInfo = _.reduce(video.querySelectorAll('a'), function(memo, aele) {
        const linkto = aele.getAttribute('href');
        if(!linkto || !linkto.length || !aele.textContent.length)
            return memo;
        if(linkto.match(/^\/channel/) || linkto.match(/^\/user/)) {
            memo.authorName = aele.textContent;
            memo.authorSource = linkto;
        }
        return memo;
    }, {
        authorName: null,
        authorSource: null
    });

    /* if(!authorInfo.authorName)
        debugger; */

    const title = video
        .querySelector('[title]')
        .getAttribute('title');
    const arialabel = video
        .querySelector('h3')
        .querySelector('[aria-label]')
        .getAttribute('aria-label');

    const isLive = !!video.querySelector('.badge-style-type-live-now');
    const arinfo = longlabel.parser(arialabel, authorInfo.authorName, isLive);
    const sectionName = findSection(video);

    // debug("%d %s", position, sectionName);
    return {
        position,
        title,
        ...authorInfo,
        sectionName,
        href,
        videoId,
        views: arinfo.views,
        arialabel,
        isLive,
        published: arinfo.timeago ? arinfo.timeago.humanize() : null,
        secondsAgo: arinfo.timeago ? arinfo.timeago.asSeconds() : NaN,
    };
}

function unpackCorrection(corelem) {
    if(corelem.tagName === 'YT-FORMATTED-STRING')
        return corelem.textContent;
    return _.compact(_.flatten(_.map(corelem.children, unpackCorrection)));
}

function process(envelop) {
    /* this function process a page like: 
    https://www.youtube.com/results?search_query=fingerprinting
       and the logic here is: look for any video, and then move above 
       until you figure if belong to a 'macrosection' ("For You", "People Also Watched")
       or not. By using ytd-video-renderer the order is attributed */

    const videos = envelop.jsdom.querySelectorAll('ytd-video-renderer');
    if(!videos.length) {
        debuge("Search result of %s doesn't seem having any video!",
            envelop.impression.nature.query);
        return null;
    }
    const results = _.map(videos, dissectVideoAndParents);
    const correction = envelop.jsdom.querySelector('yt-search-query-correction');

    const retval = {
        ...envelop.impression.nature,
        results
    };
    /* this is the only optional field, and might have two or four elements in the list */
    if(correction)
        retval.correction = unpackCorrection(correction);

    return retval;
}

/*
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
    if(queriesWritten || unCheckedRetVal)
        debug("Saved %d query and %d search results", queriesWritten, unCheckedRetVal);
 */

module.exports = {
    process,
};
