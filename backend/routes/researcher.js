const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('routes:researcher');
const nconf = require('nconf');

const fs = require('fs');
const util = require('util');
const readFile = util.promisify(fs.readFile);


const utils = require('../lib/utils');
const automo = require('../lib/automo');

async function researcher(req) {

    debug("publicKey: (%s)", req.params.publicKey);

    return { json: null };
};

module.exports = {
    researcher
};
