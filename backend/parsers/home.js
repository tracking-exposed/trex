const _ = require('lodash');
const debug = require('debug')('parser:home');

const longlabel = require('./longlabel');
const logged = require('./video').logged;

// TODO find sections 
function dissectSelectedVideo(e) {
    const infos = {};

    try {
        infos.textTitle = e.querySelector('#video-title-link').textContent;
    } catch(error) {
        // debug("Failure in textTitle: %s\n\t%s", error.message, e.querySelector("#video-title-link").innerHTML);
        infos.textTitle = '';
        infos.error = true;
    }
    try {
        infos.href = e.querySelector('a').getAttribute('href');
    } catch(error) {
        // debug("Failure in href: %s\n\t%s", error.message, e.querySelector("a").innerHTML);
        infos.href = '';
        infos.error = true;
    }
    try {
        infos.authorName = e.querySelector('#text-container.ytd-channel-name').querySelector('a').textContent;
    } catch(error) {
       //  debug("Failure in authorName: %s\n\t%s", error.message, e.querySelector('#text-container.ytd-channel-name').innerHTML);
        infos.authorName = '';
        infos.error = true;
    }
    try {
        infos.authorHref = e.querySelector('#text-container.ytd-channel-name').querySelector('a').getAttribute('href');
    } catch(error) {
       //  debug("Failure in authorHref: %s\n\t%s", error.message, e.querySelector('#text-container.ytd-channel-name').innerHTML);
        infos.authorHref = '';
        infos.error = true;
    }

    const aria = e.querySelector('#video-title-link').getAttribute('aria-label');
    const mined = longlabel.parser(aria, infos.authorName, false);
    return _.merge(mined, infos, { aria });
}

function recursiveSize(e, memo) {
    const elementSize = _.size(e.outerHTML);
    const tagName = e.tagName;
    if(!tagName)
        return memo;
    const combo = elementSize + '-' + tagName.substring(0, 5);
    if(!memo)
        return recursiveSize(e.parentNode, [ combo ]);
    memo.push(combo);
    return recursiveSize(e.parentNode, memo);
}

function actualHomeProcess(D) {
    const ve = D.querySelectorAll('ytd-rich-item-renderer');
    debug("There are %d videos apparently", _.size(ve));
    const sizes = [];
    // sizes is a debug accumulator filled as side effect below 
    const selected = _.map(ve, function(e, i) {
        sizes.push(recursiveSize(e));
        try {
            let videoInfo = dissectSelectedVideo(e);
            videoInfo.order = i + 1;
            _.last(sizes).push(videoInfo);
            return videoInfo;
        } catch(error) {
            const f = e.querySelector('#video-title-link');
            const s = f ? f.getAttribute('aria-label') : null;
            _.last(sizes).push({error: true, order: i + 1, label: s});
            return {
                order: i + 1,
                error: true,
                reason: error.message,
                aria: s,
            }
        }
    });
    debug("Parsing completed. [erros|not videos]: %j over %d",
        _.countBy(selected, { error: true }), _.size(selected)); 
    _.each(sizes, function(s, i) {
        const info = s.pop();
        if(info.error)
            console.log(i, info.order, JSON.stringify(s), "\t<error: ", info.label, ">");
        else
            console.log(i, info.order, JSON.stringify(s), "\t", info.title);
    }) 
    return { selected: _.reject(selected, { error: true }) };
}

function process(envelop) {

    let extracted = null;
    try {
        extracted = actualHomeProcess(envelop.jsdom);
    } catch(e) {
        debug("Error in processing %s (%d): %s",
            envelop.impression.href, envelop.impression.size, e.message);
        return null;
    }

    extracted.type = 'home';

    try {
        extracted.login = logged(envelop.jsdom);
        /* if login is null, it means failed check */
    } catch(error) {
        debug("Exception in logged(): %s", error.message);
        extracted.login = null;
    }

    /* remove debugging/research fields we don't want in mongo */
    _.unset(extracted, 'ptc');
    _.unset(extracted, 'check');
    return extracted;
};

module.exports = {
    process,
};