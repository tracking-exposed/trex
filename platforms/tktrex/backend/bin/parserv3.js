#!/usr/bin/env node

/* eslint-disable */

const _ = require('lodash');
const debug = require('debug')('tktrex:parserv3');
const nconf = require('nconf');
const fs = require('fs');
const { actualExecution } = require('../lib/parser');

nconf.argv().env().file({ file: 'config/settings.json' });

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
const repeat = !!nconf.get('repeat');

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
  actualExecution(actualRepeat, filter, id, stop);
} catch (e) {
  console.log('Error in wrapperLoop', e.message);
  process.exit(1);
}
