const _ = require('lodash');
const nconf = require("nconf");
const debug = require('debug')('parsers:description');

function description(envelop, previous) {

    if(previous.nature.type == "foryou" || 
       previous.nature.type == "following" )
        return { description: null };

    const spans = envelop.jsdom.querySelectorAll('span');
    const texts = _.map(spans, function(span) {
        return span.textContent;
    });

    const retval = texts.join('').trim();
    debug("%d = %s", spans.length, retval);

    return { description: retval }
};

module.exports = description;
