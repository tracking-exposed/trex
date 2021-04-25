const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('routes:experiments');

const automo = require('../lib/automo');
const params = require('../lib/params');

async function submission(req) {
    debug("submission received! %j", req.body);
    return {json: {dah: true}};
};

async function csv(req) {
    const expname = params.getString(req, 'expname', true);
    debug("get %s", expname);
};

module.exports = {
    submission,
    csv
};