#!/usr/bin/env node
const _ = require('lodash');
const nconf = require('nconf');
const bluebird = require('bluebird');
const fs = bluebird.promisifyAll(require('fs'));
const debug = require('debug')('scripts:precise');

const parse = require('../lib/parse');
const video = require('../parsers/video');

nconf.argv().env().file({ file: 'config/content.json' });

const source = nconf.get('source');
if(!source) {
    console.log("Required 'source' as parameter");
    return;
}

nconf.stores.env.readOnly = false;
nconf.set('fulldump', true);
nconf.set('retrive', true);
nconf.stores.env.readOnly = true;

/* remind: this is skipping the pipeline of lib.parse.parseHTML */
return fs
    .readFileAsync(source, { encoding: 'utf8'})
    .then(function(content) {
        const id = source.replace('.html', '').substr(-40);

        if(_.size(id) != 40)
            throw new Error("yttrex - wrong ID, not found 40 hex");
        if(_.size(content) < 300000)
            throw new Error("yttrex - unusual condition, content < 300000");

        return parse.initialize({
            html: content,
            id
        })
    })
    .then(video.isVideo)
    .then(function(i) {
        if(!i)
            throw new Error("yttrex - Not a video");
        return i;
    })
    .then(video.process)
    .tap(function(r) {
        if(r)
            console.log(JSON.stringify(r.video, undefined, 1));
    })
    // .then(parse.save)
    .catch(function(error) {
        console.log(source, "Error", error.message);
        if(!_.startsWith(error.message, 'yttrex -')) {
            console.log(error.stack);
        }
    });