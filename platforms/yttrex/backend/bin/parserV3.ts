#!/usr/bin/env ts-node

/* eslint-disable */

import _ from 'lodash';
import nconf from 'nconf';
import fs from 'fs';
import { GetParserProvider } from '../lib/parser/parser';
import mongo3 from '../lib/mongo3';
import { parsers, toMetadata } from '../parsers';

nconf.argv().env().file({ file: 'config/settings.json' });

const FREQUENCY = 10;
const AMOUNT_DEFAULT = 20;
const BACKINTIMEDEFAULT = 1;

const run = async () => {
  let htmlAmount = _.parseInt(nconf.get('amount'))
    ? _.parseInt(nconf.get('amount'))
    : AMOUNT_DEFAULT;

  const stop = _.parseInt(nconf.get('stop'))
    ? _.parseInt(nconf.get('stop'))
    : 0;
  const backInTime = _.parseInt(nconf.get('minutesago'))
    ? _.parseInt(nconf.get('minutesago'))
    : BACKINTIMEDEFAULT;
  const id = nconf.get('id');
  const filter = nconf.get('filter')
    ? JSON.parse(fs.readFileSync(nconf.get('filter'), 'utf-8'))
    : null;

  const repeat = nconf.get('repeat') === 'true';

  /* application starts here */
  try {
    /* this is the begin of the parsing core pipeline.
     * gets htmls from the db, if --repeat 1 then previously-analyzed-HTMLS would be
     * re-analyzed. otherwise, the default, is to skip those and wait for new
     * htmls. To receive htmls you should have a producer consistend with the
     * browser extension format, and bin/server listening
     *
     * This script pipeline might optionally start from the past, and
     * re-analyze HTMLs based on --minutesago <number> option.
     * */

    const mongoR = await mongo3.clientConnect({ concurrency: 1 });
    const mongoW = await mongo3.clientConnect();

    if (!mongoR || !mongoW) {
      throw new Error('Failed to connect to mongo!');
    }

    /* call the async infinite loop function */
    void GetParserProvider({
      db: {
        api: mongo3,
        read: mongoR,
        write: mongoW,
      },
      parsers,
      toMetadata,
    }).run({
      singleUse: typeof id === 'string' ? id : false,
      filter,
      stop,
      repeat,
      backInTime,
      htmlAmount,
    });
  } catch (e) {
    console.log('Error in wrapperLoop', e.message);
    process.exit(1);
  }
};

void run();
