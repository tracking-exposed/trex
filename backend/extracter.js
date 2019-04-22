#!/usr/bin/env node
const Promise = require('bluebird');
const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('extracter');
const nconf = require('nconf');

nconf.file({ file: 'config/settings.json' });

const mongo = require('./lib/mongo');
const utils = require('./lib/utils');

return mongo
    .read('metadata', {})
    .map(function(p) {
        let related = _.map(p.related, function(e) {
            let r = _.pick(e, [ 'id', 'videoId', 'title', 'source', 'vizstr']);
            r.suggestionOrder = e.index;
            return r;
        });
        let clean = {
            watched: p.title,
            since: p.publicationString,
            credited: p.authorName,
            channel: p.authorSource,
            savingTime: p.savingTime,
            watcher: p.watcher
        };
        clean.watchedId = p.videoId.replace(/\&.*/, '');
        return _.map(related, function(eachone) {
            return _.extend(eachone, clean);
        });
    })
    .then(_.flatten)
    .then(function(all) {
        const fs = Promise.promisifyAll(require('fs'));
        const destf = 'ytmetamerged.json';
        console.log("dumping", _.size(all), "objects in", destf);
        return fs.writeFileAsync(destf, JSON.stringify(all, undefined, 1));
    });
