const _ = require('lodash');
const moment = require('moment');

const unrecognizedWordList = [];
const langopts = [
  { sostantivo: 'views', separator: 'by', locale: 'en', viewcount: comma },
  { sostantivo: 'view', separator: 'by', locale: 'en', viewcount: comma },
  { sostantivo: 'vistas', separator: 'de', locale: 'es', viewcount: comma },
  { sostantivo: 'visualitzacions', separator: 'de:', locale: 'ct', viewcount: dots }, // spanish catalan
  { sostantivo: 'visualizzazioni', separator: 'di', locale: 'it', viewcount: dots },
  { sostantivo: 'visualizzazione', separator: 'di', locale: 'it', viewcount: dots },
  { sostantivo: 'visualizações', separator: '', locale: 'pt', viewcount: dots },
  { sostantivo: 'visualização', separator: '', locale: 'pt', viewcount: dots },
  { sostantivo: 'visualizaciones', separator: 'de', locale: 'es', viewcount: dots }, // spanish (otro?)
  { sostantivo: 'visninger', separator: 'af', locale: 'nn', viewcount: dots }, // norvegian
  { sostantivo: 'avspillinger', separator: 'af', locale: 'nn', viewcount: dots }, // norvegian
  { sostantivo: 'vues' , separator: 'de', locale: 'fr', viewcount: empty },
  { sostantivo: 'vue' , separator: 'de', locale: 'fr', viewcount: empty },
  { sostantivo: 'ganger', separator: 'av', locale: 'nn', viewcount: empty }, // it is "times" not visualization in norwegian
  { sostantivo: 'weergaven', separator: 'door', locale: 'nl', viewcount: dots }, // Dutch
  { sostantivo: 'Aufrufe', separator: 'von', locale: 'de', viewcount: dots },
  { sostantivo: 'Aufruf', separator: 'von', locale: 'de', viewcount: dots },
  { sostantivo: 'просмотров', separator: 'Автор:', locale: 'ru', viewcount: empty },
  { sostantivo: 'просмотра', separator: 'Автор:', locale: 'ru', viewcount: empty },
  { sostantivo: 'просмотр', separator: 'Автор:', locale: 'ru', viewcount: empty },
];

function sanityCheck(l) {
  if(_.size(l) < 20)
    throw new Error(2);
}

function NoViewsReplacer(l, sosta) {
  /* [Write Time at 9 is BACK! by The Goulet Pen Company 9 minutes ago No views,
        should return 0 views */
  const x = [ 'No', 'Nessuna', 'Ingen', 'Keine', 'Nenhuma', 'Aucune' ];
  return _.reduce(x, function(memo, wordThatMeansNothing) {
    const parseable = ` 0 ${sosta}`;
    const r = new RegExp(`\\s${wordThatMeansNothing}\\s${sosta}\\.?$`);
    return _.replace(memo, r, parseable);
  }, l);
}

function parser(l, source, isLive) {
  /* logic:
        1) find which language is the locale, by pattern matching 'sostantivo' and 'separator'
            - found? proceeed
            - not found? throw an exception, as part of the exception the last word
        2) get the view, and the label updated string. 'viewcount' return an integer. if is a livestream, it's different */
  if(!_.size(source))
    throw new Error('No source');

  sanityCheck(l);
  const viewssost = _.last(l.split(' '));

  let langi = _.find(langopts, { sostantivo: viewssost });
  if(!langi) {
    const specialfinal = viewssost.substr(_.size(viewssost) - 4, 4);
    langi = _.find(langopts, { sostantivo: specialfinal });
  }

  if(!langi) {
    throw new Error('1> locale not found!' + viewssost);
  }
    
  l = NoViewsReplacer(l, langi.sostantivo);
  const { views, liveStatus, reducedLabel } = langi.viewcount(l, langi.sostantivo, isLive);
  if(_.isNaN(views)) {
    throw new Error('2> ' + viewssost);
  }
    
  /* logic:
        3) by $authorName it is guarantee come at last, after every user controller input and 
           before the timing info. We retrive the time info and parse the duration and relative */
  const halfsep = `${_.size(langi.separator) ? ' ': ''}${langi.separator} ${source}`;
  const separatorCheck = _.size(reducedLabel.split(halfsep));
  const timeinfo = _.last(reducedLabel.split(halfsep));
  const title = _.first(reducedLabel.split(halfsep));
  if(separatorCheck < 2) {
    throw new Error('Separator Error locale: ' + langi.locale);
  }

  /*  4) because time ago (e.g. 1 week ago) is always expressed with one unit, one amount, 
           and optionally a stop-word like 'ago', then we pick before this and the leftover 
           it is the remaining text to parse */
  const timeago = getPublicationTime(timeinfo);

  /*  5) to simplify this, duration of the video is take somewhere else */
  return {
    views,
    title,
    timeago,            // it is a moment.duration() object
    isLive,
    locale: langi.locale,
  };
}

/* ****************************** * functions included above * ******************************** */
const relativeConMapping = [
  {
    'amount': 1,
    'unit': 'seconds',
    'words': [
      'секунд', 'секунда', 'секунды', 'seconds',
      'secondi', 'second', 'secondo',
    ],
  },
  {
    'amount': 1,
    'unit': 'minutes',
    'words': [
      'minuti', 'minutos', 'minutes', 'минут',
      'месяцев', 'минуты', 'минут', 'Minuten',
      'minutter', 'minute', 'minuto',
    ],
  },
  {
    'amount': 1,
    'unit': 'hour',
    'words': [
      'horas', 'heure', 'hores', 'hora', 'ora',
      'ore', 'uur', 'hours', 'hour', 'timer',
      'Stunde', 'Stunden', 'heures', 'час', 'часа',
      'часов', 'time',
    ],
  },
  {
    'amount': 1,
    'unit': 'day',
    'words': [
      'dias', 'dia', 'dies', 'días', 'día',
      'dag', 'dager', 'dagen', 'dage', 'giorni',
      'giorno', 'days', 'day', 'jours', 'jour',
      'uge', 'Tagen', 'Tag', 'дня', 'день', 'дней',
      'døgn',
    ],
  },
  {
    'amount': 7,
    'unit': 'day',
    'words': [
      'settimana', 'settimane', 'setmana',
      'setmanes', 'week', 'weeks', 'uger', 'weken',
      'semana', 'semanas', 'semaines', 'semaine',
      'Woche', 'Wochen', 'uke', 'uker', 'недели',
      'неделю',
    ],
  },
  {
    'amount': 1,
    'unit': 'month',
    'words': [
      'md.', 'mes', 'mesos', 'mês', 'mese',
      'mesi', 'mois', 'maand', 'maanden', 'meses',
      'month', 'months', 'måned', 'måneder',
      'Monaten', 'Monat', 'месяц', 'месяца',
    ],
  },
  {
    'amount': 1,
    'unit': 'year',
    'words': [
      'year', 'years', 'jaar', 'año', 'Jahren',
      'Jahr', 'anni', 'anno', 'años', 'anos',
      'ano', 'ans', 'any', 'anys', 'an', 'år',
      'года', 'лет', 'год',
    ],
  },
];

const timeRegExpList = [
  /\s?(\d+)\s(\D+)\s?/,
  /\s?(\d+)\s(\D+)\s\D+?/, 
  /\s?\D+\s(\d+)\s(\D+)\s?/, 
];

function relativeTimeMap(word) {
  return _.reduce(relativeConMapping, function(memo, e) {
    if(memo)
      return memo;

    if(e.words.includes(word) )
      memo = [ e.amount, e.unit ];

    return memo; 
  }, null);
}
function getPublicationTime(timeinfo) {

  const timeago = _.reduce(timeRegExpList, function(memo, rge) {
    const m = timeinfo.match(rge);
    return memo || m; 
    // this priority on existing 'memo' matter, because the 3rd regexp (longer)
    // might otherwise overwrite the first success and include dirty data.
  }, null);
  if(!timeago) {
    throw new Error(`can't regexp timeago |${timeinfo}| might be language separator`);
  }

  const convertedNumber = _.parseInt(timeago[0]);
  const duration = _.reduce(timeago[0].split(' '), function(memo, word) {
    const momentinfo = relativeTimeMap(word);
    if(_.isNull(momentinfo))
      return memo;

    const total = (convertedNumber * momentinfo[0]);
    const mabbe = moment.duration(total, momentinfo[1]);
    return mabbe;
  }, null);

  if(_.isNull(duration)) {
    /* necessary to report what's didn't get processed */
    const fullwordlist = _.flatten(_.map(relativeConMapping, 'words'));
    const missing = _.filter(timeago[0].split(' '), function(labelword) {
      if(!_.isNaN(_.parseInt(labelword)))
        return false;
      return !fullwordlist.includes(labelword);
    });
    const updated = _.uniq(_.concat(unrecognizedWordList, missing));
    if(_.size(updated) > _.size(unrecognizedWordList)) {
      _.each(missing, function(mw) {
        if(!unrecognizedWordList.includes(mw))
          unrecognizedWordList.push(mw);
      });
    }
    throw new Error(`Lack of time mapping relativeConMapping ${timeago} |${timeinfo}|`);
  }

  if(!duration.isValid())
    throw new Error(`Invalid duration! from ${timeago} to ${timeinfo}`);

  return duration;
}


function comma(label, sosta, isLive) {
  // call as { views, liveStatus } = langi.viewcount(l, langi.sostantivo, isLive);
  const regmap = {
    variation: new RegExp(` \\d{4} ${sosta}\$`),
    hundred: new RegExp(` \\d{1,3} ${sosta}\$`),
    thousand: new RegExp(` \\d{1,3},\\d{3} ${sosta}\$`),
    million: new RegExp(` \\d{1,3},\\d{3},\\d{3} ${sosta}\$`),
    gangamstyle: new RegExp(` \\d{1,2},\\d{3},\\d{3},\\d{3} ${sosta}\$`),
  };
  let reducedLabel = null;
  const views = _.reduce(regmap, function(memo, rge, name) {
    const match = rge.exec(label);
    if(match) {
      memo = _.parseInt(match[0].replace(sosta, '').replace(',', '').trim());
      reducedLabel = label.substr(0, match.index);
    }
    return memo;
  }, -1);
  if(views < 0)
    throw new Error('failure in regexp parsing (comma)');
  return { views, isLive, reducedLabel };
}
function empty(label, sosta, isLive) {
  /* because of the strange charCodeAt = 8239 or 160 
       which are space (like 0x20) but some kind of unicode alphabe ?
     * we should transform it */
  const fixedlabel = _.reduce(_.times(_.size(label) * 2), function(memo, number) {
    /* the +10 above is due to labels apparently returning smaller than source, it is
         * fully dependent from the number of unicode chars. .charAt($toolong) return '' */
    const val = label.charCodeAt(number);
    if(val == 8239 || val == 160) 
      memo += ' ';
    else 
      memo += label.charAt(number);
    return memo;
  }, '').trim();
  const regmap = {
    hundred: new RegExp(` \\d{1,3} ${sosta}\$`),
    thousand: new RegExp(` \\d{1,3} \\d{3} ${sosta}\$`),
    million: new RegExp(` \\d{1,3} \\d{3} \\d{3} ${sosta}\$`),
    gangamstyle: new RegExp(` \\d{1,2} \\d{3} \\d{3} \\d{3} ${sosta}\$`),
  };
  let reducedLabel = null;
  const views = _.reduce(regmap, function(memo, rge, name) {
    const match = rge.exec(fixedlabel);
    if(match) {
      memo = _.parseInt(match[0].replace(sosta, '').replace(' ', '').trim());
      reducedLabel = fixedlabel.substr(0, match.index);
    }
    return memo;
  }, -1);
  if(views < 0)
    throw new Error('failure in regexp parsing (empty)');
  return { views, isLive, reducedLabel };
}
function dots(label, sosta, isLive) {
  const regmap = {
    hundred: new RegExp(` \\d{1,4} ${sosta}\$`),
    thousand: new RegExp(` \\d{1,3}\\.\\d{3} ${sosta}\$`),
    million: new RegExp(` \\d{1,3}\\.\\d{3}\\.\\d{3} ${sosta}\$`),
    gangamstyle: new RegExp(` \\d{1,2}\\.\\d{3}\\.\\d{3}\\.\\d{3} ${sosta}\$`),
  };
  let reducedLabel = null;
  const views = _.reduce(regmap, function(memo, rge, name) {
    const match = rge.exec(label);
    if(match) {
      memo = _.parseInt(match[0].replace(sosta, '').replace('.', '').trim());
      reducedLabel = label.substr(0, match.index);
    }
    return memo;
  }, -1);
  if(views < 0)
    throw new Error('failure in regexp parsing (dots)');
  return { views, isLive, reducedLabel };
}

module.exports = {
  parser,
  relativeConMapping,
  unrecognized: unrecognizedWordList,
};
