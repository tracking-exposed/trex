#!/usr/bin/env node

/* eslint-disable */

const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('tktrex:parserv3');
const debuge = require('debug')('tktrex:parserv3:error');
const overflowReport = require('debug')('tktrex:OVERFLOW');
const nconf = require('nconf');
const fs = require('fs');

/* pchain is the utility modeuly for the parser chain */
const pchain = require('../lib/parserchain');

nconf.argv().env().file({ file: 'config/settings.json' });

async function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

const FREQUENCY = 10;
const AMOUNT_DEFAULT = 20;
const BACKINTIMEDEFAULT = 1;

let htmlAmount = _.parseInt(nconf.get('amount'))
  ? _.parseInt(nconf.get('amount'))
  : AMOUNT_DEFAULT;

const stop = _.parseInt(nconf.get('stop')) ? _.parseInt(nconf.get('stop')) : 0;
const backInTime = _.parseInt(nconf.get('minutesago'))
  ? _.parseInt(nconf.get('minutesago'))
  : BACKINTIMEDEFAULT;
const id = nconf.get('id');
const filter = nconf.get('filter')
  ? JSON.parse(fs.readFileSync(nconf.get('filter'), 'utf-8'))
  : null;
const singleUse = !!id;
const repeat = !!nconf.get('repeat');

let nodatacounter = 0,
  processedCounter = 0;
let lastExecution = moment().subtract(backInTime, 'minutes').toISOString();
let computedFrequency = 10;
const stats = { currentamount: 0, current: null };

async function pipeline(e) {
  try {
    processedCounter++;
    const structure = {
      failures: {},
      source: e,
      log: {},
      findings: {},
    };
    for (let extractorName of _.keys(pchain.dissectorList)) {
      try {
        let mined = await pchain.wrapDissector(
          pchain.dissectorList[extractorName],
          extractorName,
          e,
          structure
        );
        _.set(structure.findings, extractorName, mined);
      } catch (error) {
        _.set(structure.failures, extractorName, error.message);
      }
    }
    debug(
      '#%d\t(%d mins) http://localhost:1313/debug/html/#%s %s',
      processedCounter,
      _.round(
        moment.duration(moment() - moment(e.html.savingTime)).asMinutes(),
        0
      ),
      e.html.id
    );

    return structure;
  } catch (error) {
    debuge(
      '#%d\t pipeline general failure error: %s',
      processedCounter,
      error.message
    );
    return null;
  }
}

async function executeParsingChain(htmlFilter) {
  const envelops = await pchain.getLastHTMLs(htmlFilter, htmlAmount);

  if (!_.size(envelops.sources)) {
    nodatacounter++;
    if (nodatacounter % 10 == 1) {
      debug(
        '%d no data at the last query: %j %j (processed %d)',
        nodatacounter,
        _.keys(htmlFilter),
        htmlFilter.savingTime,
        processedCounter
      );
    }
    lastExecution = moment.utc().subtract(BACKINTIMEDEFAULT, 'm').toISOString();
    computedFrequency = FREQUENCY;
    return;
  } else {
    lastExecution = moment.utc(_.last(envelops.sources).html.savingTime);
    computedFrequency = 0.1;
  }

  if (!envelops.overflow)
    overflowReport('<NOT>\t\t%d documents', _.size(envelops.sources));
  else
    overflowReport(
      'first %s (on %d) <last +minutes %d> next filter set to %s',
      _.first(envelops.sources).html.savingTime,
      _.size(envelops.source),
      _.round(
        moment
          .duration(
            moment.utc(_.last(envelops.sources).html.savingTime) -
              moment.utc(_.first(envelops.sources).html.savingTime)
          )
          .asMinutes(),
        1
      ),
      lastExecution
    );

  if (stats.currentamount)
    debug(
      '[+] %d htmls in new parsing sequences. (previous %d took: %s) and now process %d htmls',
      processedCounter,
      stats.currentamount,
      moment.duration(moment() - stats.current).humanize(),
      _.size(envelops.sources)
    );

  stats.current = moment();
  stats.currentamount = _.size(envelops.sources);

  const results = [];
  for (const entry of envelops.sources) {
    results.push(await pipeline(entry));
  }
  /* results is a list of objects: [ {
        source: { dom, html },
        findings: { $dissector1, $dissector2 },
        failures: { $dissectorN, $dissectorX } },
        log: { $dissectorName: sizeOfFinding }
    ] */

  console.table(
    _.map(results, function (r) {
      r.log.id = r.source.html.id;
      if (r.findings.nature) {
        return {
          ...r.log,
          ...r.findings.nature,
        };
      } else {
        return {
          ...r.log,
          type: 'error',
        };
      }
    })
  );

  const newmetas = [];
  for (const entry of results) {
    try {
      const m = pchain.buildMetadata(entry);
      newmetas.push(m);
    } catch (error) {
      debug(
        'Error in pchain.buildMetadata [%s] id %s',
        error.message,
        entry.source.html.id
      );
      debug('%s', error.stack);
    }
  }

  const logof = [];
  for (const metadata of newmetas) {
    try {
      let x = await pchain.updateMetadataAndMarkHTML(metadata);
      logof.push(x);
    } catch (error) {
      debug(
        'Error in pchain.updateMetaAndMarkHTML [%s] id %s',
        error.message,
        metadata.id
      );
      debug('%s', error.stack);
    }
  }

  return {
    findings: _.map(results, function (e) {
      return _.size(e.findings);
    }),
    failures: _.map(results, function (e) {
      return _.size(e.failures);
    }),
    logof,
  };
}

async function actualExecution(actualRepeat) {
  try {
    // pretty lamest, but I need an infinite loop on an async function -> IDFC!
    for (let times of _.times(0xffffff)) {
      let htmlFilter = {
        savingTime: {
          $gt: new Date(lastExecution),
        },
      };
      if (!actualRepeat) htmlFilter.processed = { $exists: false };

      if (filter) {
        debug('Focus filter on %d IDs', _.size(filter));
        htmlFilter.id = { $in: filter };
      }
      if (id) {
        debug('Targeting a specific htmls.id');
        htmlFilter = { id };
      }

      if (stop && stop <= processedCounter) {
        console.log(
          'Reached configured limit of ',
          stop,
          '( processed:',
          processedCounter,
          ')'
        );
        process.exit(processedCounter);
      }

      let stats = await executeParsingChain(htmlFilter);
      if (singleUse) {
        console.log('Single execution done!');
        process.exit(1);
      }
      await sleep(computedFrequency * 1000);
    }
    console.log(
      "Please note what wasn't supposed to never happen, just happen: restart the software ASAP."
    );
  } catch (e) {
    console.log('Error in filterChecker', e.message, e.stack);
    process.exit(1);
  }
}

/* application starts here */
try {
  if (filter && id)
    throw new Error("Invalid combo, you can't use --filter and --id");

  if (id && htmlAmount != AMOUNT_DEFAULT)
    debug('Ignoring --amount because of --id');

  if (stop && htmlAmount > stop) {
    htmlAmount = stop;
    debug('--stop %d imply --amount %d', stop, htmlAmount);
  }

  let actualRepeat =
    repeat || !!id || !!filter || backInTime != BACKINTIMEDEFAULT;
  if (actualRepeat != repeat) debug('--repeat it is implicit!');

  /* this is the begin of the parsing core pipeline.
   * gets htmls from the db, if --repeat 1 then previously-analyzed-HTMLS would be
   * re-analyzed. otherwise, the default, is to skip those and wait for new
   * htmls. To receive htmls you should have a producer consistend with the
   * browser extension format, and bin/server listening
   *
   * This script pipeline might optionally start from the past, and
   * re-analyze HTMLs based on --minutesago <number> option.
   * */

  /* call the async infinite loop function */
  actualExecution(actualRepeat);
} catch (e) {
  console.log('Error in wrapperLoop', e.message);
  process.exit(1);
}
