import _ from 'lodash';

import longlabel from '../../backend/parsers/longlabel';

function labelsOpportunisticParsing(memo, n, i) {
    console.log(i);
    let isNext = n.closest("a.ytp-next-button");
    let isVideo = n.closest("#video-title");
    let videoBlock = n.closest("a.ytd-compact-video-renderer");
    let hasSVG = n.querySelectorAll('svg');
    let label = n.getAttribute('aria-label');

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
            let texts = _.compact(_.map(_.first(videoBlock.innerText.split('\n')), function(t) {
                return _.size(_.trim(t)) ? _.trim(t) : null;
            })); // check che hai cambiato forse per sbaglio messi troppi sanity checks
            let mined = longlabel.parser(label, texts[1], false);
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
                            let url = i.getAttribute('src');
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
        } catch(e) { console.log(e.message, "ad")}
    }
    else if(selectorName == "channel") {
        if(_.size(_.compact(_.map(matches, 'textContent')).join('')) > 0) {
            console.log("channel", JSON.stringify(_.compact(_.map(matches, 'textContent'))));
            debugger;
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
        console.log("over", JSON.stringify(_.compact(_.map(matches, 'textContent'))));
    }
    else {
        console.log("This is ia weird problem", selectorName);
    }

    console.log(selectorName, extra, "extra metadata found:", _.size(extra), JSON.stringify(_.countBy(extra, 'type')));
    return extra;
}


module.exports ={
    extendLabels,
    mineExtraMetadata,
}