#!/usr/bin/env node
const Promise = require('bluebird');
const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('ytparserv');
const nconf = require('nconf');

const mongo = require('../lib/mongo');
const parse = require('../lib/parse');

/* configuration for elasticsearch */
const echoes = require('../lib/echoes');
nconf.argv().env().file({ file: 'config/settings.json' });

echoes.addEcho("elasticsearch");
echoes.setDefaultEcho("elasticsearch");

const FREQUENCY = 1; // seconds

const backInTime = _.parseInt(nconf.get('minutesago')) ? _.parseInt(nconf.get('minutesago')) : 10;

var lastExecution = moment().subtract(backInTime, 'minutes').toISOString();

console.log(`considering the lastActivities since ${backInTime} minutes ago, [minutesago] overrides (${lastExecution})`);

function getLastActive() {

    return mongo
        .read(nconf.get('schema').supporters, { lastActivity: {
            $gt: new Date(lastExecution) 
        }})
        .map(function(user) {
            return user.p;
        })
        .tap(function(pseudos) {
            if(_.size(pseudos))
                debug("%j active in lastActivity", pseudos);
        });
}

function infiniteLoop() {
    /* this will launch other scheduled tasks too */
    return Promise
        .resolve()
        .delay(FREQUENCY * 1000)
        .then(getLastActive)
        .map(function(p) {
            let htmlFilter = {
                p,
                savingTime: {
                    $gt: new Date(lastExecution)
                },
                processed: { $exists: !!nconf.get('repeat') }
            };
            /* 
             * isVideo true|false, processed true|false|undefined,
             * they are all caugth, becuase of user selection, can
             * be so big. and then we parse them in parseHTML
             */
            return parse.parseHTML(htmlFilter, false);

        }, { concurrency: 1})
        .tap(function(results) {
            lastExecution = moment().toISOString();

            if(_.size(results)) {
                debug("updated lastExection: %s, results: %d metadata written", lastExecution, _.size(results));
                lastCycleActive = true;
                logActivity(results);
            } else {
                lastCycleActive = false;
            }
        })
        .then(infiniteLoop);
};

function logActivity(results) {
    /* results contain an aggregated sum, such as:
       [ {
        "metadata": 8,
        "errors": 0
       } ]                                         */
    echoes.echo({
        index: "ytparserv",
        success: _.first(results).metadata,
        errors: _.first(results).errors,
    });
};

infiniteLoop();
