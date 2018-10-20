#!/usr/bin/env node
var _ = require('lodash');
var moment = require('moment');
var debug = require('debug')('linker');
var mongo = require('../lib/mongo');
var parse = require('../lib/parse');


function checkLinking(metadata, html) {

    retval.linker = true;

    debugger;
    debug("%s", JSON.stringify(metadata, undefined, 2));
    // debug("%s %s [%s], %j", retval.href, retval.id, retval.title, stats);
    return retval;
};

var videoPage = {
    'name': 'linker',
    'requirements': { linker: { $exists: false} },
    'implementation': checkLinking,
    'since': "2018-06-13",
    'until': moment().format('YYYY-MM-DD 23:59:59')
};

return parse.please(videoPage);
