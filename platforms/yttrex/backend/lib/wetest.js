#!/usr/bin/env node
const _ = require('lodash');
const debug = require('debug')('lib:wetest');
const nconf = require('nconf');

const utils = require('../lib/utils');
const mongo3 = require('@shared/providers/mongo.provider');
const moment = require('moment');

nconf.argv().env().file({ file: 'config/settings.json' });

const START_TIME_FOR_RELATIVE_COUNTING = {};
function startTime(t) {
    START_TIME_FOR_RELATIVE_COUNTING.m = moment(t);
}

/* these function are explitic for wetest experiments and are kept separated from 
 * the invoker script and from the libraries */

async function pickFromDB(filter, sorting, special) {
    try {
        const mongoc = await mongo3.clientConnect();
        let rv = [];

        if(special) {
            rv = await mongo3.aggregate(mongoc, nconf.get('schema').htmls, [{ 
                "$match": filter
            },
            { "$project": { "id": 1, "metadataId": 1, "size": 1, 'href': 1, 'savingTime': 1 }}]);
        } else {
            rv = await mongo3.read(mongoc, nconf.get('schema').metadata, filter, sorting);
        }
        debug("Completed DB access to fetch: %j: %d objects retrived",
            filter, _.size(rv));

        await mongoc.close();
        return rv;
    } catch(e) {
        debug("Error in pickFromDB: %s", e.message);
        return null;
    }
}

/* ------------- START of accuracy debug section ------------------ */
const accuracyCounters = {};
function upsert(key, subkey, update) {
    const value = _.get(accuracyCounters, key + '.' + subkey, 0);
    _.set(accuracyCounters, key + '.' + subkey, value + update);
}
function updateStats(entry) {
    /* THIS function is call when the raw data is cleaned/updated for release */
    _.each(entry, function(value, key) {
        if(typeof value === typeof undefined)
            upsert(key, 'undefined', 1);
        else if(_.isNull(value))
            upsert(key, 'null', 1);
        else if(typeof value === typeof 1)
            upsert(key, 'int', 1);
        else if(typeof value === typeof "")
            upsert(key, 'string', 1);
        else if(_.isInteger(value.length))
            upsert(key, 'list', 1);
        else if(typeof value === typeof {})
            upsert(key, 'object', 1);
        else if(typeof value === typeof true && value)
            upsert(key, 'true', 1);
        else if(typeof value === typeof true && !value)
            upsert(key, 'false', 1);
        else
            debug("unknown value type %s", typeof value);
    });
}
function accuracyDump(fullamount) {
    /* this dump the stats collected by accuracyCounter */
    _.each(accuracyCounters, function(value, entryName) {
        debug("%s%s%s", entryName, _.times(30 - _.size(entryName), " ").join(), _.map(value, function(amount, variableType) {
            const p = (amount / fullamount) * 100;
            return variableType + ": " + _.round(p, 1) + '%' ;
        }).join(" | "));
    });
}
/* ------------- END of accuracy debug section ------------------ */

function applyWetest1(e) {
    if(!START_TIME_FOR_RELATIVE_COUNTING.m.isValid())
        throw new Error("initialize startTime in the sw calling the lib");

    /* this is apply to video and homepage */
    const hoursOffset = moment.duration( moment(e.savingTime) - START_TIME_FOR_RELATIVE_COUNTING.m ).asHours();
    _.set(e, 'hoursOffset', _.round(hoursOffset));
    _.set(e, 'experiment', 'wetest1');
    _.set(e, 'pseudonym', utils.string2Food(e.publicKey + "weTest#1") );
    _.unset(e, 'publicKey');
    updateStats(e);
    return e;
}

module.exports = {
    startTime,
    pickFromDB,
    applyWetest1,
    updateStats,
    accuracyDump,
    accuracyCounters,
}
