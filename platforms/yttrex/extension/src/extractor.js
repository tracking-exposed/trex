/* eslint-disable */

import { ytLogger } from 'app/app';
import _ from 'lodash';

import longlabel from './longlabel';

function labelsOpportunisticParsing(memo, n, i) {
    // console.log(i);
    const isNext = n.closest("a.ytp-next-button");
    const isVideo = n.closest("#video-title");
    const videoBlock = n.closest("a.ytd-compact-video-renderer");
    const hasSVG = n.querySelectorAll('svg');
    const label = n.getAttribute('aria-label');

    if ( !!isNext && isNext.length ) {
        console.log(i, "trovato next!", n.getAttribute('data-tooltip-text'));
        memo.push({
            type: 'next',
            label,
            tooltip: n.getAttribute('data-tooltip-text'),
        })
    }
    if ( !!hasSVG && hasSVG.length && label && _.size(label) ) {
        if(label.match(/.*[0-9].*/)) {
            // console.log(i, 'svg', label);
            memo.push({
                type: 'number',
                label,
                svg: _.first(hasSVG).outerHTML,
            });
        }
    }
    if( !!isVideo && isVideo.length ) {
        try {
            const texts = _.compact(_.map(_.first(videoBlock.innerText.split('\n')), function(t) {
                return _.size(_.trim(t)) ? _.trim(t) : null;
            })); // check che hai cambiato forse per sbaglio messi troppi sanity checks
            const mined = longlabel.parser(label, texts[1], false);
            console.log("[llp] -->", texts[1], "++", mined, mined.timeago.humanize());
            memo.push(_.extend(mined, {
                type: 'label',
                vbhtml: videoBlock.outerHTML,
                label,
                texts,
            }));
        } catch(e) {
            if(e.message == 2) {
                // might be used to language/UX detection
            } else {
                console.log("[E] extendLabels", !!isNext, !!isVideo, !!videoBlock, !!hasSVG, !!label, e);
            }
        }
    }
    return memo;
}

function extendLabels(matches) {
    return _.reduce(matches, labelsOpportunisticParsing, []);
}

function mineExtraMetadata(selectorName, matches) {

    ytLogger("Ignored function because %s hasn't the right content", selectorName);
    return null;

    let extra = [];
    if(selectorName == 'label') {
        console.log("selector Label, mineExtraMetadata calls extendLabel over", _.size(matches));
        /* analyisis of labels: mine the videso, find 'next' and other numbers */
        extra = extendLabels(matches);
    }
    else if(selectorName == "banner") {
        if(_.size(_.compact(_.map(matches, 'textContent')).join('')) > 0) {
            _.each(matches, function(n) {
                try {
                    extra.push({
                        type: 'banner',
                        url: _.first(_.compact(_.map(n.querySelectorAll('img'), function(i) {
                            const url = i.getAttribute('src');
                            if(!url.match(/^http/)) throw new Error()
                            return url;
                        }))),
                    });
                } catch(e) { }
            })
        }
    }
    else if(selectorName == "ad") {
        try {
            extra.push({
                type: 'ad',
                site: _.last(matches[0].textContent.split('\n')),
            });
        } catch(e) { console.error(e.message, "ad")}
    }
    else if(selectorName == "channel") {
        console.log("This shouldn't exist anymore");
        if(_.size(_.compact(_.map(matches, 'textContent')).join('')) > 0) {
            console.log("channel", JSON.stringify(_.compact(_.map(matches, 'textContent'))));
        }
    }
    else if(selectorName == "title") {
        try {
            extra.push({
                type: 'innerTitle',
                text: _.first(_.compact(_.map(matches, 'innerText'))),
            });
        } catch(e) { }
    }
    else if(selectorName == "over") {
        ytLogger('selectorName: %s -> %s', selectorName,
            JSON.stringify(_.compact(_.map(matches, 'textContent'))));
    }
    else {
        ytLogger('Not handled this selectorName: %s', selectorName);
        return null;
    }

    if(extra.length)
        ytLogger('selectorName %s produced , extra, "extra metadata found:', _.size(extra), JSON.stringify(_.countBy(extra, 'type')));
    return extra;
}


module.exports ={
    extendLabels,
    mineExtraMetadata,
}
