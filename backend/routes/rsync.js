const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('routes:rsync');
const nconf = require('nconf');

const fs = require('fs');

const utils = require('../lib/utils');
const automo = require('../lib/automo');

// This module allow you to pick the first AMOUNT_ELEMS per day, the first N received per day.
const AMOUNT_ELEMS = 15;


async function rsync(req) {

    const daysago = _.parseInt(req.params.daysago) ?  _.parseInt(req.params.daysago) : 0;
    const when = moment().subtract(daysago, 'day').startOf('day');
    debug("days ago: %s (%s), picking last %d received content", daysago, when, AMOUNT_ELEMS);

    const videos = await automo.getFirstVideos(when, {amount: AMOUNT_ELEMS, skip: 0});

    const complete = _.map(videos, function(v) {
        let content = fs.readFileSync(v.htmlOnDisk, "utf8");
        return { v, content };
    });

    return { json: complete };
};

module.exports = {
    rsync
};
