const _ = require('lodash');
const debug = require('debug')('lib:params');

function getInt(req, what, def) {
    var rv = _.parseInt(_.get(req.params, what));
    if(_.isNaN(rv)) {
        if(!_.isUndefined(def))
            rv  = def;
        else  {
            debug("getInt: Error with parameter [%s] in %j", what, req.params);
            rv = 0;
        }
    }
    return rv;
}

function getVideoId(req, what) {
    const retv = _.get(req.params, what);
    if(retv.match(/[A-Za-z0-9\-_]{11}/))
        return retv;

    debug("Expected youtube videoId but rejected [%s]", retv);
    throw new Error("Invalid videoId received");
}

function getString(req, what, mandatory) {
    var rv = _.get(req.params, what);
    if(_.isUndefined(rv)) {
        debug("getString: Missing parameter [%s] in %j", what, req.params);
        rv = "";
    }
    if(!rv.length && mandatory)
        throw new Error("Lack of mandatory parameter " + what);
    return rv;
}

function optionParsing(amountString, max) {
    const MAXOBJS = max ? max : 200;
    try {
        const amount = _.parseInt(_.first(amountString.split('-')));
        const skip = _.parseInt(_.last(amountString.split('-')));
        if(!(_.isNaN(amount) && _.isNaN(skip))) {
            return {
                amount,
                skip
            };
        }
    } catch(error) {}
    return {
        amount: MAXOBJS,
        skip: 0
    };
};

function getDate(req, what, def) {
    debug("getDate: Received %s, imported %s",
        _.get(req.params, what),  _.get(req.params, what, new Date(def)));
    const d = _.get(req.params, what, new Date(def));
    return _.isString(d) ? new Date(d) : d;
}

module.exports = {
    getInt,
    getVideoId,
    getString,
    optionParsing,
    getDate,
};
