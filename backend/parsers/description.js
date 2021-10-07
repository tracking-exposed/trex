const _ = require('lodash');
const nconf = require("nconf");
const debug = require('debug')('parsers:home');

function home(envelop, previous) {

    if(previous.nature.type !== "home")
        return false;

    return { };
};

module.exports = home;
