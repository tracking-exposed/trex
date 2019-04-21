#!/usr/bin/env node
const _ = require('lodash');
const nconf = require('nconf');
const bluebird = require('bluebird');
const fs = bluebird.promisifyAll(require('fs'));
const debug = require('debug')('scripts:precise');

const parse = require('../lib/parse');
const video = require('../parsers/video');

nconf.argv().env().file({ file: 'config/settings.json' });

const id = nconf.get('id');
if(!id) {
    console.log("Required 'id' as parameter");
    return;
}

nconf.stores.env.readOnly = false;
nconf.set('fulldump', true);
nconf.set('retrive', true);
nconf.stores.env.readOnly = true;

let htmlFilter = { id };
return parse
    .parseHTML(htmlFilter, false)
    .tap(function(r) {
        if(r)
            console.log(JSON.stringify(r, undefined, 1));
    })
    .catch(function(error) {
        console.log(id, "Error", error.message);
        if(!_.startsWith(error.message, 'yttrex -')) {
            console.log(error.stack);
        }
    });
