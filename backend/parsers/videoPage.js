#!/usr/bin/env node
var _ = require('lodash');
var cheerio = require('cheerio');
var moment = require('moment');
var debug = require('debug')('parser:video');
var parse = require('../lib/parse');

var stats = {
    processed: 0,
    related: 0,
    error: 0
};

function printGraph($node, shifts) {

    var spaces = _.reduce(_.times(shifts * 2), function(memo, _i) {
        return memo += " ";
    }, "");

    if($node.type === 'text')
        debug("%s[%s]", spaces, $node.data);
    else
        debug("%s%s", spaces, $node.name);

    _.each($node.children, function($child) {
        printGraph($child, shifts + 2);
    });
};

function parseVideoPage(metadata, html) {

    var cleanHtml = html.replace(/[\n\n]+/g, '').replace(/\>\s{1,12}\</g, '><')
    var $ = cheerio.load(cleanHtml);

    stats.processed++;
    debug("processing %s: %d bytes", metadata.href, _.size(html));

    var videoTitle = $('h1')[0].children[0].children[0].data;
    var authorName = cheerio.load( $('#owner-container').html() )('a').text();
    var authorChannel = cheerio.load( $('#owner-container').html() )('a').attr('href');

    printGraph( $('#owner-container')[0], 1 );
    debugger;

    if(!videoTitle || !authorName || !authorChannel )
        debug("missing important info: videoTitle [%s] authorName [%s] authorChannel [%s]", 
            videoTitle, authorName, authorChannel);

    var $related =  $('h3 > span');
    var related = _.map( $related, function($span, order) {
        var title = $span.attribs.title;
        var aria = $span.attribs['aria-label']
        return {
            order: order,
            title: title,
            aria: aria
        };
    });
    debug("%s", JSON.stringify(related, undefined, 2));

    var $watch = $('a[href^="/watch"]')
    var watch = _.map( $watch, function($a, order) {
        var href = $a.attribs.href;
        if($a.children && $a.children[0] && $a.children[0].name === 'h3') {
            console.log("skip this ", href);
            return {
                text: cheerio.load($a.children[0]).text(),
                filter: true,
                href: href
            };
        }
        else {

            try { 
                var thumbnail = $a.children[0].children[0].attribs.src.replace(/\?.*/,'');
            } catch(error) {
                debug("Error in %s", href);
                debugger;
                return {
                    filter: true,
                    href: href,
                    order: order,
                    error: error
                }
            }

            return {
                href: href,
                thumbnail: thumbnail,
                order: order
            }
        }
    });
    debugger;
    debug("%s", JSON.stringify(watch, undefined, 2));

    debugger;
        console.log(title);
        console.log(aria);
        return;

        var link = cheerio.load($($h3.parent).html())("a").attr('href');
        var l = cheerio.load($($h3.parent).html())("a").attr('aria-label');

        /*
         * worst case scenario, this works too:
         * cheerio.load($($h3.parent).html())("a")[1].children[0].data     */
        var source = cheerio.load($($h3.parent).html())('[href^="/user"]').text();
        var sourceKind = null;
        if(_.size(source))
            sourceKind = 'user';
        else {
            source = cheerio.load($($h3.parent).html())('[href^="/channel"]').text();
            if(_.size(source))
                sourceKind = 'channel';
        }

        try {
            debugger;

            var viewMatch  = l.match(/[0-9,]*\ views/);
            var viewStr = viewMatch[0];
            /* > l.match(/[0-9,]*\ views/)
             * [ '2,480,904 views',
             *   index: 106,
             *   input: 'The Moons of Mars Explained -- Phobos & Deimos MM#… Nutshell 4 years ago 115 seconds 2,480,904 views' ]
             */
            var viewNumber = _.parseInt(viewStr.split(' ')[0].replace(/,/g, ''));
            var durationStr = l
                .substr(0, viewMatch.index)
                .match(/[0-9,]*\ (seconds|minutes|hours)/)[0].split(' ');

            order++;
            // debug("%d/%d, title: (%s) link:(%s)", fakeorder, order, title, link);

            return {
                order: order,
                title: title,
                link: link,
                viewStr: viewStr,
                views: viewNumber,
                source: source,
                sourceKind: sourceKind
            };

        } catch (error) {
            return null;
        }

    debug("(%s) [%s] [%s] %d h3, end with %d related",
        videoTitle, authorName, authorChannel,
        _.size( $('h3')), _.size(_.compact(related)));

    var retO = _.extend(metadata, {
        title: videoTitle,
        author: authorName,
        channel: authorChannel,
        related: _.orderBy(_.compact(related), 'views')
    });
    return retO;
};

var videoPage = {
    'name': 'videoPage',
    'requirements': {}, // { isVideo: true },
    'implementation': parseVideoPage,
    'since': "2018-06-13",
    'until': moment().toISOString(),
};

return parse.please(videoPage);
