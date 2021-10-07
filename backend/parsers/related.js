const _ = require('lodash');
const debug = require('debug')('parser:related');

function related(envelop, previous) {

    if(previous.nature.type !== "search")
        return false;

    if(envelop.jsdom.querySelector("#noResultBigText")) {
        return {
            related: null,
            reason: envelop.jsdom.querySelector("#noResultBigText").textContent,
        };
    }

    const relatedS = envelop.jsdom.querySelector('.relatedSearchTermsBottom');
    if(!relatedS) return { related: null };

    const retval = _.map(relatedS.querySelectorAll('a'), function(anchor) {
        return {
            name: anchor.textContent.trim(),
            href: anchor.getAttribute('href')
        };
    })
    return { related: retval };
};

module.exports = related;