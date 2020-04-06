#!/usr/bin/env node
const _ = require('lodash');
const debug = require('debug')('parser:uxlang');
const nlpdebug = require('debug')('pubtimeAPI');
const moment = require('moment');

/* GUESS TIMEDATE FORMAT & CLEAN INFO */
fmtpmap = {
    "MMM DD YYYY": /(\D{3}) (\d{1,2}) (\d{4})/,
    "DD.MM.YYYY": /(\d{2})\.(\d{2})\.(\d{4})/,
    "MMM DD, YYYY": /(\D{3}) (\d{1,2}), (\d{4})/,
    "DD MMM YYYY": /(\d{1,2})\.?\s(\D{3,4})\.? ([20\d\d])/, 
    // "19 февр. 2019 г."     +     "21. mar. 2020"
};

const trimmable = [
    'Streamed live on ',
    'Started streaming ',
    'Ha empezado a emitir en directo hace ',
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

    const fitting = _.reduce(fmtpmap, function(memo, re, fmt) {
        // cleanString + re torna ft ?
        const chk = re.exec(cleanString);
        if(chk && chk[1] && chk[2] && chk[3]) {
            debug("getFormatCleanString results => %s", fmt)
            memo = fmt;
        }
        return memo;
    }, null)

    if(!fitting && _.size(cleanString) === _.size(publicationString))
        debug("getFormatCleanString fail: no replace and not match: %s", cleanString);

    return { cleanString, fmt: fitting };
}

/* ------------- RELATIVE PUBLICATION STRING --------------- */
const localized = {
    'horas': 'hours',
    'hours': 'hours',
    'ore': 'hours',

    'minutos': 'minutes',
    'minutes': 'minutes',
    'minuti': 'minutes',

    'segundos': 'seconds'
};

function standardLatinWay(stri) {
    const matches = stri.match(/(\d+) (\D+)/);
    if(!matches || !matches[1] || !matches[2]) {
        debug("Unfitting regexp to match: %s", stri);
        process.exit(1);
    }
    // todo improve the regexp, this is to removed the ' ago' of '2 hours ago'
    const localizedUnit = _.first(matches[2].split(' '));
    if(_.isUndefined(localized[localizedUnit])) {
        debug("WARNING: |%s| not found!", localizedUnit);
        process.exit(1);
    }
    return {
        amount: _.parseInt(matches[1]),
        unit: localized[localizedUnit]
    }
}

const lamepx = [{
    type: 'video-pubstring',
    first: 'Started',
    unitamount: standardLatinWay 
}, {
    type: 'video-pubstring',
    first: 'Premiere',
    unitamount: standardLatinWay 
}, {
    type: 'video-pubstring',
    first: 'Se', // why chunks and not string match? doh. Se transmitió.
    unitamount: standardLatinWay 
}, {
    type: 'video-pubstring',
    first: 'Streamed',
    unitamount: standardLatinWay 
}, {
    type: 'video-pubstring',
    first: 'Comenzó',
    unitamount: standardLatinWay 
}];

function findRelative(type, stri, clientTime) {
    const chunks = _.split(stri, ' ');
    const first = _.first(chunks);
    const found = _.find(lamepx, { type, first });
    try {
        const { amount, unit } = found.unitamount(stri);
        nlpdebug("Relative match consider %s minus %d %s", clientTime, amount, unit);
        return moment(clientTime).subtract(amount, unit);
    } catch(e) {
        nlpdebug("Relative ERROR: (might happen for many reasons): %s: from |%s|", e.message, stri);
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
    first: 'Szukaj',
    iso2: 'pt'
}, {
    type: 'video',
    first: 'Søk', // VERIFY THIS ( ["Søk","Se senere","Del","Kopiér linken","InformasjonShopping", )
    iso2: 'no'
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
        process.exit(1);
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
            debug("Fatal error in deducing format and extrating prublicationTime from %s", publicationString)
            process.exit(2);
        }
        nlpdebug("publicationString parsing complete %s\t=>\t%s", publicationString, mobj.format());

        /* once acquired, conver in Date() */
        publicationTime = new Date(mobj.format("YYYY-MM-DD"));
        /* restore locale */
        moment.locale('en');
    } else {
        throw new Error("lack of HTML snippet!")
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