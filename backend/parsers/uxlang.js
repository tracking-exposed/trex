#!/usr/bin/env node
const _ = require('lodash');
const debug = require('debug')('parser:uxlang');
const nlpdebug = require('debug')('pubtimeAPI');
const moment = require('moment');

/* GUESS TIMEDATE FORMAT & CLEAN INFO */
fmtpmap = {
    "MMM DD YYYY": /(\D{3}) (\d{1,2}) (\d{4})/,
    "MMM DD, YYYY": /(\D{3}) (\d{1,2}), (\d{4})/,
    "DD MMM YYYY": /(\d{1,2})\s(\D{3,4})\.? ([20\d\d])/, // "19 февр. 2019 г.".
};

const trimmable = [
    'Streamed live on ',
    'Started streaming '
];

function getFormatCleanString(publicationString) {
    // here bullshit like:
    // Streamed live on Oct 6, 2018
    // should return { cleanString: 'Oct 6, 2018', fmt: "MMM DD, YYYY" }

    const cleanString = _.reduce(trimmable, function(memo, prefix) {
        if(_.startsWith(publicationString, prefix) ) {
            memo = publicationString.substring(_.size(prefix));
        }
        return _.isNull(memo) ? publicationString : memo;
    }, null);

    if(_.size(cleanString) === _.size(publicationString))
        debug("String cleaning didn't result in any change: %s", cleanString);

    const fitting = _.reduce(fmtpmap, function(memo, re, fmt) {
        // cleanString + re torna ft ?
        const chk = re.exec(cleanString);
        if(chk && chk[1] && chk[2] && chk[3]) {
            debug("getGormatClean string works with %s", fmt)
            memo = fmt;
        }
        return memo;
    }, null)

    return { cleanString, fmt: fitting };
}

/* ------------- RELATIVE PUBLICATION STRING --------------- */
function englishStreaming(stri) {
    const matches = stri.match(/(\d+)\ (\w+)\ ago/);
    return {
        amount: _.parseInt(matches[1]),
        unit: matches[2]
    }
}
const lamepx = [{
    type: 'video-pubstring',
    iso2: 'en',
    first: 'Started',
    unitamount: englishStreaming
}];

function findRelative(type, stri, clientTime) {
    const chunks = _.split(stri, ' ');
    const first = _.first(chunks);
    const found = _.find(lamepx, { type, first });
    try {
        const { amount, unit } = found.unitamount(stri);
        nlpdebug("relative match consider %s minus %d %s", clientTime, amount, unit);
        return moment(clientTime).subtract(amount, unit);
    } catch(e) {
        nlpdebug("relative ERROR: (might happen for many reasons): %s: from |%s|", e.message, stri);
        debugger;
        return moment('invalid date');
    }
}


/* --------------------------------------------------------------------------------------------
   https://www.loc.gov/standards/iso639-2/php/code_list.php                                   */
const lame = [{
    type: 'video',
    first: 'Search',
    iso2: 'en'
}, {
    type: 'video',
    first: 'Введите запрос',
    iso2: 'ru'
}, {
    type: 'video',
    first: 'Cerca',
    iso2: 'it'
}, {
    type: 'video',
    first: 'Αναζήτηση',
    iso2: 'el'
}, {
    type: 'video',
    first: 'Pesquisar',
    iso2: 'pt'
}, {
    type: 'video',
    first: 'Buscar',
    iso2: 'es'
}, {
    type: 'video',
    first: 'Suchen',
    iso2: 'de'
}];

function findLanguage(type, chunks) {
    const found = _.find(lame, { type, first: _.first(chunks) });
    if(!found) {
        debug("findLanguage failured please add manually: %s |%s|\n%s",
            type, _.first(chunks), JSON.stringify(chunks));
        debugger;
        return null;
    }
    return found.iso2;
}

// extenral API
function sequenceForPublicationTime(D, blang, clientTime) {
    
    // from the language in the buttons we infer the language
    const m = _.uniq(_.compact(_.map(D.querySelectorAll('button'), function(e) {
        let l = _.trim(e.textContent)
        if(_.size(l)) return l;
    })));

    let publicationTime, publicationString = null;
    const serverSideBlang = findLanguage('video', m);
    blang = serverSideBlang ? serverSideBlang : blang;

    if(!serverSideBlang && !blang)
        debugger;

    if(serverSideBlang != blang)
        nlpdebug("Difference in ssblang %s and csblang %s", serverSideBlang, blang);

    if(_.size(D.querySelector('#date > yt-formatted-string').textContent) > 2 ) {
       
        publicationString = D.querySelector('#date > yt-formatted-string').textContent;
        moment.locale(blang);
        const { fmt, cleanString } = getFormatCleanString(publicationString);

        /* this might happen if the string has a relative timing, but also wrong language not 
           manager properly in 'findLanguage' and 'getFormatCleanString' might cause this error */
        if(!fmt) {
            nlpdebug("Special management, 'relative timing!' (%s) %s with clientTime %s",
                blang, publicationString, clientTime);
            mobj = findRelative('video-pubstring', publicationString, clientTime);
        }
        else  {
            mobj = moment.utc(cleanString, fmt);
        }

        if(!mobj.isValid()) {
            console.log("Terrible failure we can't accept blah")
            process.exit(2);
        }
        nlpdebug("publicationString parsing complete %s\t=>\t%s", publicationString, mobj.format());

        /* once acquired, conver in Date() */
        publicationTime = new Date(mobj.format("YYYY-MM-DD"));
        /* restore locale */
        moment.locale('en');
    } else {
        console.log("Terrible lacking of the HTML element we really want");
        process.exit(2);
    }

    if(blang != serverSideBlang) {
        nlpdebug("%s %s differs, blang and serverblang", blang, serverSideBlang);
        // is not yet managed, should be both considered? 
        process.quit(2)
    }
    nlpdebug("SOURCE |%s| BECOME => |%s| (uxlang %s)", publicationString, publicationTime, blang);

    return { publicationTime, publicationString, ifLang: blang };
}


/* PARSING MADNESS ITZ OVER */
module.exports = {
    sequenceForPublicationTime, // the external APIS

    getFormatCleanString,       // internal f's
    findRelative,               // internal f's
    findLanguage,               // internal f's
};