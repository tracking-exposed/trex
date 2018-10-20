#!/usr/bin/env node
var _ = require('lodash');
var moment = require('moment');
var debug = require('debug')('parser:video');
var errorrevi = require('debug')('related:view');
var errorcore = require('debug')('metadata:core');
var errorlike = require('debug')('metadata:likes');
var errorview = require('debug')('metadata:view');
var errorrele = require('debug')('metadata:related');
var parse = require('../lib/parse');

var jsdom = require("jsdom");
var { JSDOM } = jsdom;

var stats = { skipped: 0, error: 0, suberror: 0, success: 0 };

function labelParser(l) {
    try {
        var viewMatch  = l.match(/[0-9,]*\ views/);
        var viewStr = viewMatch[0];
        /* > l.match(/[0-9,]*\ views/)
         * [ '2,480,904 views',
         *   index: 106,
         *   input: 'The Moons of Mars Explained -- Phobos & Deimos MM#… Nutshell 4 years ago 115 seconds 2,480,904 views' ]
         */
        var viewNumber = _.parseInt(viewStr.split(' ')[0].replace(/,/g, ''));

        try {
            var durationStr = l
                .substr(0, viewMatch.index)
                .match(/[0-9,]*\ (seconds|minutes|hours)/)[0].split(' ');
        } catch(error) {
            errorrevi("Probably a live video? no duration!");
            var duration = false;
        };
        return {
            viewStr: viewStr,
            views: viewNumber,
            durationStr: durationStr,
        };
    } catch (error) {
        errorrevi("failure in parsing %s: %s", viewMatch, error);
        return { 
            error: true,
            source: l
        };
    }
};

function parseViews(D) {
    var node = _.first(D.getElementsByClassName('view-count'));
    try {
        var viewStr = node.innerHTML
        var viewNumber = _.parseInt(viewStr.split(' ')[0].replace(/,/g, ''));
        return { viewStr: viewStr, viewNumber: viewNumber };
    } catch(error) {
        errorview("(%s): %s", node.innerHTML, error);
        return {
            error: true,
            source: node.innerHTML
        };
    }
};

function parseLikes(D) {
    var nodes = D.querySelectorAll('.ytd-toggle-button-renderer > yt-formatted-string');
    try {
        var likes = nodes[0].getAttribute('aria-label');
        var dislikes = nodes[1].getAttribute('aria-label');
        return { likes: likes, dislikes: dislikes };
    } catch(error) {
        /* expected two elements in nodes */
        errorlike("(%d) %s", _.size(nodes), error);
        return {
            error: true,
            source: [ nodes[0].outerHTML, nodes[1].outerHTML ]
        }
    }
};

function relatedMetadata(e, i) {
    var element = new JSDOM(e.innerHTML);

    var title = element.window.document.getElementById('video-title').title;
    var longlabel = element.window.document.getElementById('video-title').getAttributeNode('aria-label').value;
    var source = element.window.document.getElementById('metadata').querySelectorAll('[title]')[0].title;
    var link = element.window.document.querySelectorAll('a')[0].getAttributeNode('href').value
    var videoId = link.replace(/.*v=/, '');

    var x = _.extend(labelParser(longlabel), {
        index: i + 1,
        title: title,
        source: source,
        videoId: videoId,
    });
    return x;
};

function processVideo(html) {
    // var dom = new JSDOM(html);
    var dom = new JSDOM(html.replace(/\n\ +/g, ''));
    var D = dom.window.document;

    /* video metadata */
    var vTitle = _.get(_.first(D.querySelectorAll('h1 > yt-formatted-string ')), 'innerHTML');
    if(!vTitle) debugger; // throw new Error("unable to get title: 'h1 > yt-formatted-string '");

    var authorName = _.get(_.first(D.querySelectorAll('yt-formatted-string > a')), 'innerHTML');
    if(!authorName) throw new Error("unable to get authorName: 'yt-formatted-string > a'");

    var authorSource = _.first(D.querySelectorAll('yt-formatted-string > a')).getAttributeNode('href').value;

    /* non mandatory info */
    var viewInfo = parseViews(D);
    var likeInfo = parseLikes(D);

    /* related + sponsored */
    var related = _.map(D.querySelectorAll('ytd-compact-video-renderer'), relatedMetadata);
    var p = D.querySelectorAll('ytd-compact-promoted-video-renderer');
    if(_.size(p))
        debugger;

    return {
        title: vTitle,
        authorName: authorName,
        authorSource: authorSource,
        related: related,
        viewInfo: viewInfo,
        likeInfo: likeInfo
    };
};

function parseVideoPage(metadata, html) {

    var retval = null;

    if(metadata.href === "https://www.youtube.com/") {
        console.log("Skipping YT homepage");
        stats.skipped++;
        retval = _.extend(metadata, { processed: true, skipped: true });
    } else {
        try {
            var extracted = processVideo(html);

            var re = _.filter(extracted.related, { error: true });
            stats.suberror += _.size(re);
            var ve = _.filter(extracted.viewInfo, { error: true });
            stats.suberror += _.size(ve);
            var le = _.filter(extracted.likeInfo, { error: true });
            stats.suberror += _.size(le);

            if(_.size(re)) errorrele("related error %s", JSON.stringify(re, undefined));
            if(_.size(ve)) errorview("views error %s", JSON.stringify(ve, undefined));
            if(_.size(le)) errorlike("likes error %s", JSON.stringify(re, undefined));
           
            stats.success++;
            retval = _.extend(metadata, extracted, { processed: true, skipped: false });
        } catch(error) {
            debug("unacceptable error! [%s] from %s: %s", metadata.href, metadata.clientTime, error);
            stats.error++;
            retval = _.extend(metadata, { processed: false, skipped: false });
        }
    }
    retval.videoParser = true;
    debug("%s %s [%s], %j", retval.href, retval.id, retval.title, stats);
    return retval;
};

var videoPage = {
    'name': 'videoParser',
    'requirements': { processed: { $exists: false} },
    'implementation': parseVideoPage,
    'since': "2018-06-13",
    'until': moment().format('YYYY-MM-DD 23:59:59')
};

return parse.please(videoPage);
