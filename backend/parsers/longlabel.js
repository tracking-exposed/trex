#!/usr/bin/env node
const _ = require('lodash');
const debug = require('debug')('parser:longlabel');
const debugcheck = require('debug')('check:longlabel');
const moment = require('moment');

const uxlang = require('./uxlang');

const langopts = [
    { sostantivo: 'views', separator: 'by', locale: 'en', viewcount: comma },
    { sostantivo: 'vistas', separator: 'de', locale: 'es', viewcount: comma },
    { sostantivo: "visualitzacions", separator: 'de:', locale: 'ct', viewcount: dots }, // spanish catalan
    { sostantivo: "visualizzazioni", separator: 'di', locale: 'it', viewcount: dots },
    { sostantivo: "visualizações", separator: '', locale: 'pt', viewcount: dots },
    { sostantivo: "visualizaciones", separator: 'de', locale: 'es', viewcount: dots }, // spanish (otro?)
    { sostantivo: "visninger", separator: 'af', locale: 'nn', viewcount: dots }, // norvegian
    { sostantivo: "vues" , separator: 'de', locale: 'fr', viewcount: empty },
    { sostantivo: "ganger", separator: 'av', locale: 'nn', viewcount: empty }, // it is "times" not visualization in norwegian
    { sostantivo: "weergaven", separator: 'door', locale: 'nl', viewcount: dots}, // Dutch
    { sostantivo: "Aufrufe", separator: 'von', locale: 'de', viewcount: dots},
];

function parser(l, source, isLive) {
    /* logic:
        1) find which language is the locale, by pattern matching 'sostantivo' and 'separator'
            - found? proceeed
            - not found? throw an exception, as part of the exception the last word
        2) get the view, and the label updated string. 'viewcount' return an integer. if is a livestream, it's different
    */

    if(isLive)
        { console.log("Live?"); process.exit(1);}

    const viewssost = _.last(l.split(' '));
    /* debug(_.last(l.split(' ')));
    debug(l.split(' ')); */
    let langi = _.find(langopts, { sostantivo: viewssost });
    if(!langi) {
        const specialfinal = viewssost.substr(_.size(viewssost) - 4, 4);
        langi = _.find(langopts, { sostantivo: specialfinal });
    }
    
    debug("<sostantivo> %s, <langi> %j", viewssost, langi);
    if(!langi)
        throw new Error("1> locale not found!" + viewssost);

    const { views, liveStatus, reducedLabel } = langi.viewcount(l, langi.sostantivo, isLive);
    if(_.isNaN(views))
        throw new Error("2> " + viewssost);
    
    /* logic:
        3) by $authorName it is guarantee come at last, after every user controller input and 
           before the timing info. We retrive the time info and parse the duration and relative */
    const halfsep = `${langi.separator} ${source}`;
    const separatorCheck = _.size(reducedLabel.split(halfsep));
    const timeinfo = _.last(reducedLabel.split(halfsep));
    // moment.locale(langi.locale);
    // parsing do not depends on this 
    // debug(reducedLabel.split(halfsep));
    if(separatorCheck < 2) {
        debugcheck("Separator Error locale (%s)", langi.locale);
        throw new Error("Separator Error locale: " + langi.locale);
    }

    /*  4) because time ago (e.g. 1 week ago) is always expressed with one unit, one amount, 
           and optionally a stop-word like 'ago', then we pick before this and the leftover 
           it is the remaining text to parse */
    const timeago = getPublicationTime(timeinfo);

    /*  5) to simplify this, duration of the video is take somewhere else */
    debug("Completed with %d %s %s", views, timeago.humanize(), langi.locale);
    return {
        views,
        timeago,            // it is a moment.duration() object
        isLive,
        locale: langi.locale,
    };
}

function settle(mined, source, title, displayTime, expandedTime, isLive) {
    // settle wants to settle differencies we (might) got from parsing strings
    // settle it is a kind of double-check as part of the parsing chain
    return {
        recommendedLength: 0,
        recommendedLengthSe: 0,
        recommendedViews: 0,
        recommendedTitle: 0,
        recommendedPubTime: 0
    }
}

/* ****************************** * functions included above * ******************************** */
const relativeConMapping = {
    'minuti': [1, 'minutes'],
    'minutos': [1, 'minutes'],
    'minutes': [1, 'minutes'],

    'horas': [1, 'hour'],
    'heure': [1, 'hour'],
    'hores': [1, 'hour'],
    'hora': [1, 'hour'],
    'ora': [1, 'hour'],
    'ore': [1, 'hour'],
    'uur': [1, 'hour'],
    'hours': [1, 'hour'],
    'hour': [1, 'hour'],
    'timer': [1, 'hour'],
    'Stunde': [1, 'hour'],
    'Stunden': [1, 'hour'],
    'heures': [1, 'hour'],

    'dias': [1, 'day'],
    'dia': [1, 'day'],
    'dies': [1, 'day'],
    'días': [1, 'day'],
    'día': [1, 'day'],
    'dag': [1, 'day'], // Norvegian
    'dager': [1, 'day'], // Norvegian
    'dagen': [1, 'day'],
    'dage': [1, 'day'],
    'giorni': [1, 'day'],
    'giorno': [1, 'day'],
    'days': [1, 'day'],
    'day': [1, 'day'],
    'jours': [1, 'day'],
    'jour': [1, 'day'],
    'uge': [1, 'day'],
    'Tagen': [1, 'day'],
    'Tag': [1, 'day'],

    'settimana': [7, 'day'],
    'settimane': [7, 'day'],
    'setmana': [7, 'day'],
    'setmanes': [7, 'day'],
    'week': [7, 'day'],
    'weeks': [7, 'day'],
    'uger': [7, 'day'],
    'weken': [7, 'day'],
    'semana': [7, 'day'],
    'semanas': [7, 'day'],
    'semaines': [7, 'day'],
    'semaine': [7, 'day'],
    'Woche': [7, 'day'],
    'Wochen': [7, 'day'],
    'uke': [7, 'day'],
    'uker': [7, 'day'],

    'md.': [1, 'month'],
    'mes': [1, 'month'],
    'mesos': [1, 'month'],
    'mês': [1, 'month'],
    'mese': [1, 'month'],
    'mesi': [1, 'month'],
    'mois': [1, 'month'],
    'maand': [1, 'month'],
    'maanden': [1, 'month'],
    'meses': [1, 'month'],
    'month': [1, 'month'],
    'months': [1, 'month'],
    'måned': [1, 'month'],
    'måneder': [1, 'month'],
    'Monaten': [1, 'month'],
    'Monat': [1, 'month'],

    'year': [1, 'year'],
    'years': [1, 'year'],
    'jaar': [1, 'year'],
    'año': [1, 'year'],
    'Jahren': [1, 'year'],
    'Jahr': [1, 'year'],
    'anni': [1, 'year'],
    'anno': [1, 'year'],
    'años': [1, 'year'],
    'anos': [1, 'year'],
    'ano': [1, 'year'],
    'ans': [1, 'year'],
    'any': [1, 'year'],
    'anys': [1, 'year'],
    'an': [1, 'year'],
    'år': [1, 'year'],
}
const timeRegExpList = [
    /\s?(\d+)\s(\D+)\s?/,
    /\s?(\d+)\s(\D+)\s\D+?/, 
    /\s?\D+\s(\d+)\s(\D+)\s?/, 
];
function getPublicationTime(timeinfo) {

    const timeago = _.reduce(timeRegExpList, function(memo, rge) {
        let m = timeinfo.match(rge);
        return memo ? memo: m; 
        // this priority on existing 'memo' matter, because the 3rd regexp (longer)
        // might otherwise overwrite the first success and include dirty data.
    }, null);
    if(!timeago)
        throw new Error(`can't regexp timeago |${timeinfo}| might be language separator`);

    const convertedNumber = _.parseInt(timeago[0]);
    const duration = _.reduce(timeago[0].split(' '), function(memo, word) {
        let momentinfo = _.get(relativeConMapping, word);
        if(_.isUndefined(momentinfo))
            return memo;

        const total = (convertedNumber * momentinfo[0]);
        const mabbe = moment.duration(total, momentinfo[1]);
        debug("getPT: FOUND |%s| to be [%j]  parsed %d total %d",
            word, momentinfo, convertedNumber, total);
        return mabbe;
    }, null);

    if(_.isNull(duration))
        throw new Error(`Lack of time mapping relativeConMapping ${timeago} |${timeinfo}|`);

    if(!duration.isValid())
        throw new Error(`Invalid duration! from ${timeago} to ${timeinfo}`);

    debug("getPublicationTime: %s from |%s|", duration.humanize(), timeinfo);
    return duration;
}


function comma(label, sosta, isLive) {
    // call as { views, liveStatus } = langi.viewcount(l, langi.sostantivo, isLive);
    const regmap = {
        variation: new RegExp(` \\d{4} ${sosta}\$`),
        hundred: new RegExp(` \\d{1,3} ${sosta}\$`),
        thousand: new RegExp(` \\d{1,3},\\d{3} ${sosta}\$`),
        million: new RegExp(` \\d{1,3},\\d{3},\\d{3} ${sosta}\$`),
        gangamstyle: new RegExp(` \\d{1,2},\\d{3},\\d{3},\\d{3} ${sosta}\$`)
    };
    let reducedLabel = null;
    const views = _.reduce(regmap, function(memo, rge, name) {
        const match = rge.exec(label);
        if(match) {
            memo = _.parseInt(match[0].replace(sosta, '').replace(',', '').trim())
            // debug("comma,match %s memo %s reduced %s", match, memo, label.substr(0, match.index));
            reducedLabel = label.substr(0, match.index);
        }
        return memo;
    }, -1);
    if(views < 0)
        throw new Error("failure in regexp parsing (comma)");
    return { views, isLive, reducedLabel };
}
function empty(label, sosta, isLive) {
    /* because of the strange charCodeAt = 8239 or 160 
       which are space (like 0x20) but some kind of unicode alphabe ?
     * we should transform it */
    const fixedlabel = _.reduce(_.times(_.size(label) * 2), function(memo, number) {
        /* the +10 above is due to labels apparently returning smaller than source, it is
         * fully dependent from the number of unicode chars. .charAt($toolong) return '' */
        let val = label.charCodeAt(number);
        // debug("%d (%s)", val, label.charAt(number));
        if(val == 8239 || val == 160) 
            memo += " ";
        else 
            memo += label.charAt(number);
        return memo;
    }, "").trim();
    // debug("fixedlabel: %s (%d|%d)", fixedlabel, _.size(fixedlabel), _.size(label));
    const regmap = {
        hundred: new RegExp(` \\d{1,3} ${sosta}\$`),
        thousand: new RegExp(` \\d{1,3} \\d{3} ${sosta}\$`),
        million: new RegExp(` \\d{1,3} \\d{3} \\d{3} ${sosta}\$`),
        gangamstyle: new RegExp(` \\d{1,2} \\d{3} \\d{3} \\d{3} ${sosta}\$`)
    };
    let reducedLabel = null;
    const views = _.reduce(regmap, function(memo, rge, name) {
        const match = rge.exec(fixedlabel);
        if(match) {
            // debug("empty,match value in %s (%s)", name, rge);
            memo = _.parseInt(match[0].replace(sosta, '').replace(' ', '').trim())
            reducedLabel = fixedlabel.substr(0, match.index);
        }
        return memo;
    }, -1);
    if(views < 0)
        throw new Error("failure in regexp parsing (empty)");
    return { views, isLive, reducedLabel };
}
function dots(label, sosta, isLive) {
    const regmap = {
        hundred: new RegExp(` \\d{1,4} ${sosta}\$`),
        thousand: new RegExp(` \\d{1,3}\\.\\d{3} ${sosta}\$`),
        million: new RegExp(` \\d{1,3}\\.\\d{3}\\.\\d{3} ${sosta}\$`),
        gangamstyle: new RegExp(` \\d{1,2}\\.\\d{3}\\.\\d{3}\\.\\d{3} ${sosta}\$`)
    };
    let reducedLabel = null;
    const views = _.reduce(regmap, function(memo, rge, name) {
        const match = rge.exec(label);
        if(match) {
            memo = _.parseInt(match[0].replace(sosta, '').replace('.', '').trim())
            reducedLabel = label.substr(0, match.index);
        }
        return memo;
    }, -1);
    if(views < 0)
        throw new Error("failure in regexp parsing (dots)");
    return { views, isLive, reducedLabel };
}

module.exports = {
    parser,
    settle,
};
