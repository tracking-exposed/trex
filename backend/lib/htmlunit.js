var _ = require('lodash');
var moment = require('moment');
var Promise = require('bluebird');
var debug = require('debug')('lib:htmlunit');
var nconf = require('nconf');
var fs = Promise.promisifyAll(require('fs'));

var mongo = require('./mongo');
var utils = require('./utils');

function unitById(req) {
    var htmlId = req.params.htmlId;

    debug("unitById %s", htmlId);

    return mongo
        .read(nconf.get('schema').videos, {id: htmlId})
        .then(_.first)
        .then(function(video) {
            return fs
                .readFileAsync(video.htmlOnDisk, 'utf-8')
                .then(function(html) {
                    return {
                        html: html,
                        metadata: video
                    };
                });
        })
        .then(function(c) {
            return { json: c };
        }); 
}

module.exports = {
    unitById:unitById
};
