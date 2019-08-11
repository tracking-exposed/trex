const _ = require('lodash');
const moment = require('moment');
const Promise = require('bluebird');
const debug = require('debug')('lib:aggregated-limited');
const nconf = require('nconf');

const utils = require('./utils');

function dayData(reference) {
    // dayData is the hourData called by bin/count-o-clock but for 24h

    const fmt = "YYYY-MM-DD 00:00:00";

    if(!reference)
        reference = moment().format(fmt);

    const m = moment(reference);
    const offset = m.utcOffset();
    // m.utc(); // force the hour to become UTC
    // I was expecting it matter: it doesn't

    const dayOnly = m.format(fmt);
    const dayOnext = m.add(1, 'd').format(fmt);
    const dayId = utils.hash({impressionTime: dayOnly });

    debug("dayData: %s with offset %d is returning the ID between %s and %s",
        reference, offset, dayOnly, dayOnext);

    return {
        dayOnly: new Date(dayOnly),
        dayOnext,
        dayId,
        reference: dayOnly,
        m: m,
    };
}

function hourData(reference) {
    // hourData is called by bin/count-o-clock
    //
    // if is absent, we take moment.gmt()
    // if is the 'reference' variable, still should be aligned to gmt

    const fmt = "YYYY-MM-DD HH:00:00";

    if(!reference)
        reference = moment().format(fmt);

    const m = moment(reference);
    const offset = m.utcOffset();
    // m.utc(); // force the hour to become UTC
    // I was expecting it matter: it doesn't

    const hourOnly = m.format(fmt);
    const hourOnext = m.add(1, 'h').format(fmt);
    const hourId = utils.hash({impressionTime: hourOnly });

    debug("hourData: %s with offset %d is returning the ID between %s and %s",
        reference, offset, hourOnly, hourOnext);

    return {
        hourOnly: new Date(hourOnly),
        hourOnext,
        hourId,
        reference: hourOnly,
        m: m,
    };
}

module.exports = {
    hourData,
    dayData
};
