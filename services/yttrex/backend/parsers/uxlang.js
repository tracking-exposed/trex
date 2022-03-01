const _ = require('lodash');
const debug = require('debug')('parser:uxlang');
const debuge = require('debug')('parser:uxlang:error');
const nlpdebug = require('debug')('pubtimeAPI');
const moment = require('moment');

/* GUESS TIMEDATE FORMAT & CLEAN INFO */
const formatMatches = {
    "MMM DD YYYY": /(\D{3}) (\d{1,2}) (\d{4})/,
    "DD.MM.YYYY": /(\d{2})\.(\d{2})\.(\d{4})/,
    "MMM DD, YYYY": /(\D{3}) (\d{1,2}), (\d{4})/,
    "DD MMM YYYY": /(\d{1,2})\.?\s(\D{3,4})\.? ([20\d{2}])/, // "19 февр. 2019 г."     +     "21. mar. 2020"
    "mm mmm": /(\d{1,2})\s(\D)\s?\D?/, // 46 minutes ago
};

const absoluteDateIntroSentence = [
    'Streamed live on ',
    'Started streaming ',
    'Streaming avviato ',
    'Started streaming on ',
    'Ha empezado a emitir en directo hace ',
    'Premiered ',
    'Trasmesso in anteprima ',
    'Transmitido ao vivo ',
    'Trasmissione in live streaming ',
    'El estreno empezó hace ',
    'Scheduled for ',   // How should we manage future evidence?
];
const conditionalExtra = [{
    name: "Strange PT condition spotted first in [Transmitido ao vivo em 23 de mar. de 2020]",
    match: /\sde\s/,
    trimWith: function(i) { return i.replace (/\sde\s/g, ' ') }
}];

function getFormatCleanString(publicationString) {
    // here bullshit like:
    // Streamed live on Oct 6, 2018
    // should return { cleanString: 'Oct 6, 2018', fmt: "MMM DD, YYYY" }

    const trimmedString = _.reduce(absoluteDateIntroSentence, function(memo, prefix) {
        if(_.startsWith(publicationString, prefix) ) {
            memo = publicationString.substring(_.size(prefix));
        }
        return _.isNull(memo) ? publicationString : memo;
    }, null);

    const cleanString = _.reduce(conditionalExtra, function(memo, o) {
        const chk = new RegExp(o.match).exec(memo);
        if(chk)
            debug("<!> %s match with: |%s|", memo, o.name);
        return chk ? o.trimWith(memo) : memo;
    }, trimmedString);

    const fitting = _.reduce(formatMatches, function(memo, re, fmt) {
        // cleanString + re torna ft ?
        const chk = re.exec(cleanString);
        if(chk && chk[1] && chk[2] && chk[3]) {
            debug("getFormatCleanString |%s| result => %s", cleanString, fmt)
            memo = fmt;
        }
        return memo;
    }, null);

    if(!fitting && _.size(cleanString) === _.size(publicationString))
        debug("getFormatCleanString no trim and not match for %s", publicationString);
    else if(!fitting)
        debug("getFormatCleanString fail: no match: %s", cleanString);

    return { cleanString, fmt: fitting };
}

/* ------------- RELATIVE PUBLICATION STRING --------------- */
const localized = {
    'horas': 'hours',
    'hours': 'hours',
    'ore': 'hours',
    'λεπτά': 'hours',
    'heures': 'hours',
    'godzin': 'hours',      // Transmisja rozpoczęta 5 godzin temu
    'Stunden': 'hours',

    'minutos': 'minutes',
    'minutes': 'minutes',
    'minuti': 'minutes',
    'Minuten.': 'minutes',
    'Minuten': 'minutes',
    'minute': 'minutes',    // also 'less than 1 minute ago' might happen
    'Minute': 'minutes',    // Aktiver Livestream seit 2 Minuten
    'минуты': 'minutes',
    'minuten': 'minutes',

    'segundos': 'seconds',
    'seconds': 'seconds',
    'secondo': 'seconds',
    'secondi': 'seconds',
};

const regchain = [
    /(\d+)\s(\D+)/,
    /(\d+)\s(\D+)\s\D+/,
    /(\d+)\s(\D+)\s\D+\s\D+/,
    /(\d+)\s(\S+)\s\D+/,
];

function localizedRegexpChain(stri) {
    // this function process "blah blah since 321321 minutes (ago)?"
    // and you want these:                    ^^^^^^ ^^^^^^^
    const fit = _.reduce(regchain, function(memo, regpick) {
        const match = stri.match(regpick);
        const amount = (match && match[1] ) ? _.parseInt(match[1]) : 0;
        const unit = (match && match[2]) ? match[2]: null;
        if(memo)
            return memo;
        return localized[unit] ? { amount, unit: localized[unit] } : null;
    }, null);
    if(!fit) {
        debug("WARNING: |%s| not match", stri);
        throw new Error("|regexpChain and localized need an update|" + stri+ "|");
    }
    return fit || { amount: 0, unit: null };
}

const relativeOpeningString = [
    'Started',
    'Premiere',
    'Se',           // why chunks and not string match? doh. Se transmitió.
    'Ha',           // Ha empezado a emitir en directo hace 2 horas
    'Trasmesso',
    'Premiered',
    'Streamed',
    'Comenzó',
    'Трансляция',   // Трансляция началась 93 минуты назад
    'Trasmissione', // Trasmissione in live streaming 7 ore
    'Streaming',    // Streaming avviato 115 minuti fa
    'Ξεκίνησε',     // Ξεκίνησε ροή πριν από
    'Stream',       // Stream iniciado há 
    'Aktiver',      // Aktiver Livestream seit 22 Minuten
    'Diffusion',    // Diffusion lancée il y a 37 minutes
    'Diffusé',      // Diffusé en direct il y a 4 heures
    'Première',     // Première in corso. Trasmissione iniziata 13 minuti fa
    'Transmisja',   // Transmisja rozpoczęta 5 godzin temu
    'Aktiver',      // Aktiver Livestream seit 3 Stunden
    'Livestream',   // Livestream vor 6 Stunden
    'streamen',     // 37 minuten geleden begonnen met streamen
    'El',           // El estreno empezó hace 3 minutos
];

function findRelative(stri, clientTime) {
    const chunks = _.split(stri, ' ');
    const first = _.first(chunks);
    const last = _.last(chunks);
    const foundF = (_.indexOf(relativeOpeningString, first) !== -1);
    const foundL = (_.indexOf(relativeOpeningString, last) !== -1);
    if(!foundF && !foundL) {
        nlpdebug("Relative time string missing? |%s|", stri);
        return moment('invalid date');
    }
    try {
        const { amount, unit } = localizedRegexpChain(stri);
        nlpdebug("Relative match consider %s minus %d %s", clientTime, amount, unit);
        return moment(clientTime).subtract(amount, unit);
    } catch(e) {
        nlpdebug("Relative ERROR: (might happen for many reasons): %s: from |%s|", e.message, stri);
        return moment('invalid date');
    }
}


function googleHappinessCheck(cleanDate) {
    return cleanDate.replace(/Μαΐ/, 'Μαϊ');
}
/* --------------------------------------------------------------------------------------------
   https://www.loc.gov/standards/iso639-2/php/code_list.php                                   
   the collection below is meant to link a WORD (like the word 'search') to a
   two letters code locale. This is necessary to interpret localized date. */
const localizedFirstButton = [{
    type: 'video',
    first: 'Search',
    iso2: 'en'
}, {
    type: 'video',
    first: '搜索', // each (changi?) means 'search', they are two
    iso2: 'zh-CH'
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
    first: 'Szukaj', // "Szukaj","Do obejrzenia","Udostępnij","Kopiuj link"
    iso2: 'pl'
}, {
    type: 'video',
    first: 'Søk', // "Søk","Se senere","Del","Kopiér linken","InformasjonShopping"
    iso2: 'nn'    // Norway, it is 'nn' and not 'no'. 
}, {
    type: 'video',
    first: 'Rechercher',
    iso2: 'fr'
}, {
    type: 'video',
    first: 'Zoeken',
    iso2: 'nl'
}, {
    type: 'video',
    first: 'Søg',
    iso2: 'de'
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
    // note, it seems for 'home' and 'video' works the same
    const found = _.find(localizedFirstButton, { type, first: _.first(chunks) });
    if(!found) {
        debuge("findLanguage failure please add manually: %s |%s|\n%s",
            type, _.first(chunks), JSON.stringify(chunks));
        return null;
    }
    return found.iso2;
}

// The only external API is this!
function sequenceForPublicationTime(D, blang, clientTime) {

    // from the language in the buttons we infer the language
    const m = _.uniq(_.compact(_.map(D.querySelectorAll('button'), function(e) {
        const l = _.trim(e.textContent)
        if(_.size(l)) return l;
    })));

    let publicationTime; let publicationString = null;
    const serverSideBlang = findLanguage('video', m);
    blang = serverSideBlang || blang;
/*
    if(!serverSideBlang && !blang)
        nlpdebug("OOO wtf! lack of ssblang and csblang (%j)", m);

    if(serverSideBlang != blang)
        nlpdebug("!*! Difference in ssblang (winner) %s and csblang %s", serverSideBlang, blang);
*/
    publicationString = D.querySelector("#dot + .ytd-video-primary-info-renderer").textContent;
    let mobj;
    if(publicationString.length > 2) {

        moment.locale(blang);
        const { fmt, cleanString } = getFormatCleanString(publicationString);

        /* this might happen if the string has a relative timing, but also wrong language not 
           manager properly in 'findLanguage' and 'getFormatCleanString' might cause this error */
        if(!fmt) {
            nlpdebug("Special management, 'relative timing!' (%s) %s with clientTime %s",
                blang, publicationString, clientTime);
            mobj = findRelative(publicationString, clientTime);
        }
        else  {
            const fixed = googleHappinessCheck(cleanString);
            if(fixed !== cleanString)
                debug("iz Google still happy? %s => %s", cleanString, fixed)
            mobj = moment.utc(fixed, fmt);
        }

        if(!mobj.isValid()) {
            debug("Fatal error in deducing format and extrating publicationTime from |%s| with %s\n%j do some googleHappinessCheck ;)",
                publicationString, blang, moment.monthsShort());
            throw new Error("Failure in spotting format");
        }
        nlpdebug("publicationString parsing complete %s\t=>\t%s", publicationString, mobj.format());

        /* once acquired, conver in Date() */
        publicationTime = new Date(mobj.toISOString());
        /* restore locale */
        moment.locale('en');
    } else {
        throw new Error("Failure in spotting publication date")
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
    localizedRegexpChain,       // internal f' but unit-tested
    localized,                  // localized time unit
};
