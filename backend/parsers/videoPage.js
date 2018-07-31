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

    debugger;
    var $ = cheerio.load(snippet.html);
    var retO = {};

    return retO;
};

var videoPage = {
    'name': 'videoPage',
    'requirements': {}, // { isVideo: true },
    'implementation': parseVideoPage,
    'since': "2018-11-13",
    'until': moment().toISOString(),
};

return parse.please(videoPage);
