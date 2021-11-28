const _ = require('lodash');
const debug = require('debug')('parsers:description');

function description(envelop, previous) {

    /* only feedId on 'foryou' and 'following' have a description,
       not really because also if you scroll on an user timeline */
    const availin = ["foryou", "following"];

    if(previous.nature && availin.indexOf(previous.nature.type) === -1) {
        debug("No description for previous.nature %o", previous.nature);
        return null;
    }

    const spans = envelop.jsdom.querySelectorAll('span');
    const texts = _.map(spans, function(span) {
        return span.textContent;
    });

    const fullText = envelop.jsdom.querySelector('[data-e2e="video-desc"]').textContent;

    debug("bareText: %j fullText [%s]", texts, fullText);
    const nohashtagText = texts.join('').trim();

    return { description: fullText, 
        baretext: nohashtagText
    };
};

module.exports = description;
