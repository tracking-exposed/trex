#!/usr/bin/env node
const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('bin:count-o-clock');
const nconf= require('nconf');

const aggregated = require('../lib/aggregated');
const mongo = require('../lib/mongo3');
const utils = require('../lib/utils');

nconf.argv().env();
const defaultConf = nconf.get('config') || 'config/settings.json';
nconf.file({ file: defaultConf });
const schema = nconf.get('schema');
nconf.file({ file: 'config/trexstats.json' });
const statsMap = nconf.get('stats');
const name = nconf.get('name');


async function computeCount(mongoc, statinfo, filter) {
    /* here each section of config/stats.json is processed,
     * this function is called twice: once with 'hour' filter
     * and another with 'day'
     * 
     * the 'selector' is meant to be a selector of function mongo.count(),
     * the 'innercount' is implemented to count in lists
     *  */
    debug("in [%s] %s [%d variables] %s",
        statinfo.column,
        statinfo.name,
        _.size(statinfo.variables)
    );

    const counting = [];
    for (const v of statinfo.variables) {

        if(v.selector) {
            const thisfilter = Object.assign({}, filter, v.selector);
            const amount = await mongo.count(mongoc, statinfo.column, thisfilter);
            counting.push(_.set({}, v.name, amount));
        } else {
            /* there is 'innercount' the deep counter
             * v.innercount = [ 'related', { 'related.foryou': true } ]
                                 unwind,       matchToCount, 
               projectComposed = { 'related': 1 }
             */
            const projectComposed = {};
            projectComposed[v.innercount[0]] = 1;
            const amount = await mongo.aggregate(mongoc, statinfo.column, [
                { $match: filter },
                { $project: projectComposed },
                { $unwind: "$" + v.innercount[0] },
                { $match: v.innercount[1] },
                { $count: "amount" }
            ]);
            if(amount && _.size(amount))
                counting.push(_.set({}, v.name, _.first(amount).amount));
        }
    }
    return counting;
};


async function start() {
    const hoursago = utils.parseIntNconf('hoursago', 0);
    const daysago = utils.parseIntNconf('daysago', 0);
    const statshour = moment().subtract(daysago, 'd').subtract(hoursago, 'h').format();
    const tobedone = name ? _.filter(statsMap, { name }) : statsMap;

    const mongoc = await mongo.clientConnect();

    debug("Loaded %d possible statistics%s: %d to be done",
        _.size(statsMap), name ? `, demanded '${name}'` : "", _.size(tobedone));

    const daily = [];
    for (const statinfo of tobedone) {
        const dayref = aggregated.dayData(statshour);
        const dayfilter = _.set({}, statinfo.timevar, {
            $gte: new Date(dayref.reference),
            $lt: new Date(dayref.dayOnext)
        });
        const dayC = await computeCount(mongoc, statinfo, dayfilter);
        debug("Day computed %s: %j", statinfo.name, dayC);
        const ready = _.reduce(dayC, function(memo, e) {
            return _.merge(memo, e);
        }, {
            dayId: dayref.dayId,
            day: new Date(dayref.dayOnly),
            name: statinfo.name
        });
        const r = await mongo.upsertOne(mongoc, schema.stats, { dayId: dayref.dayId, name: statinfo.name }, ready);
        daily.push(r);
    }

    if(nconf.get('dayonly')) {
        console.log("--dayonly is present! quitting")
        await mongoc.close();
        return;
    }

    const hourly = [];
    for (const statinfo of tobedone) {
        const hoursref = aggregated.hourData(statshour);
        const hourfilter = _.set({}, statinfo.timevar, {
            $gte: new Date(hoursref.reference),
            $lt: new Date(hoursref.hourOnext)
        });
        const hourC = await computeCount(mongoc, statinfo, hourfilter);
        debug("Hour computed %s: %j", statinfo.name, hourC);
        const entry = _.reduce(hourC, function(memo, e) {
            return _.merge(memo, e);
        }, {
            hourId: hoursref.hourId,
            hour: new Date(hoursref.hourOnly),
            name: statinfo.name
        });
        const r = await mongo.upsertOne(mongoc, schema.stats, { hourId: hoursref.hourId, name: statinfo.name }, entry);
        hourly.push(r);
    }

    await mongoc.close();
};

try {
    start();
} catch(error) {
    debug("Unexpected error: %s", error.message);
}