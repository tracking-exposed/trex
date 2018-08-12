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

function parseVideoPage(metadata, html) {

    var $ = cheerio.load(html);
    stats.processed++;

    debug("processing %s: %d bytes", metadata.href, _.size(html));

    var videoTitle = $('h1')[0].children[0].children[0].data;
    var authorName = $('h1')[1].children[0].children[0].data;

    var order = 0;
    var related = _.map( $('h3'), function($h3, fakeorder) {

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
            var title = cheerio.load($($h3.parent).html())("a")[0].children[0].data;

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
    });

    debug("begin with %d h3, end with %d related", _.size( $('h3')), _.size(_.compact(related)));

    var retO = _.extend(metadata, {
        title: videoTitle,
        publisher: authorName,
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
