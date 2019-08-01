#!/usr/bin/env node
const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('bin:recent-fetcher');
const nconf = require('nconf');

const request = require('request');
const util = require('util');
const httpGET = util.promisify(request.get);

nconf.argv().env();
const cfgFile = nconf.get('config') ? nconf.get('config') : "config/content.json";
nconf.file({ file: cfgFile });

const baseUrl = "http://127.0.0.1:9000";

async function importDay(dayago) {

    const url = `${baseUrl}/api/v1/rsync/`;
    const = await httpGET(url);
};

_.each(_.times(0, MAX), function(day) {

    if(day) {
        console.log(`importing from ${day} days ago. Continue?`);
    }

    importDay(day);
});

async function getStuff() {
  return await readFile('test');
}
