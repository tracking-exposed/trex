#!/usr/bin/env node
const nconf = require('nconf');
const moment = require('moment');
const parse = require('../lib/parse');

nconf.argv().env().file({ file: 'config/settings.json' });

if( !nconf.get('since') || !nconf.get('until') ) {
    console.log("since and until mandatory option");
    return -1;
}

const startM  = moment(nconf.get('since')).toISOString();
const endM  = moment(nconf.get('until')).toISOString();

const htmlFilter = { savingTime: { $gt: new Date(startM), $lt: new Date(endM) } };
return parse
    .parseHTML(htmlFilter, true)
    .catch(function(error) {
        console.log(id, "Error", error.message);
        if(!_.startsWith(error.message, 'yttrex -')) {
            console.log(error.stack);
        }
    });
