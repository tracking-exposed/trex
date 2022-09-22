#!/usr/bin/env ts-node

import fs from 'fs';
import {
  getLastLeaves,
  updateAdvertisingAndMetadata,
  LeafSource,
  toMetadata,
  addDom,
  getMetadata,
} from '../lib/parser/leaf';
import _ from 'lodash';
import nconf from 'nconf';
import * as mongo3 from '@shared/providers/mongo.provider';
import { GetParserProvider } from '@shared/providers/parser.provider';
import { leafParsers } from '../parsers';
import { Ad } from '@yttrex/shared/models/Ad';
import { parserConfig } from '../parsers/config';

nconf.argv().env().file({ file: 'config/settings.json' });

const AMOUNT_DEFAULT = 20;
const BACKINTIMEDEFAULT = 1; // minutes

const run = async (): Promise<void> => {
  const htmlAmount = _.parseInt(nconf.get('amount'))
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

  const repeat = nconf.get('repeat')
    ? nconf.get('repeat') === 'true'
    : undefined;

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

    const mongoR = await mongo3.clientConnect();
    const mongoW = await mongo3.clientConnect();

    if (!mongoR || !mongoW) {
      throw new Error('Failed to connect to mongo!');
    }

    const db = {
      api: mongo3,
      read: mongoR,
      write: mongoW,
    };

    /* call the async infinite loop function */
    void GetParserProvider('leaves', {
      db,
      parsers: leafParsers,
      codecs: {
        contribution: LeafSource,
        metadata: Ad,
      },
      addDom,
      getMetadata: getMetadata(db),
      getEntryId: (e) => e.html.id,
      getContributions: getLastLeaves(db),
      getEntryDate: (e) => e.html.savingTime,
      getEntryNatureType: (e) => e.html.nature.type,
      buildMetadata: toMetadata,
      saveResults: updateAdvertisingAndMetadata(db),
      config: parserConfig,
    }).run({
      singleUse: typeof id === 'string' ? id : false,
      filter,
      stop,
      repeat,
      backInTime,
      htmlAmount,
    });
  } catch (e) {
    // eslint-disable-next-line
    console.log('Error in running the parser', e.message);
    process.exit(1);
  }
};

void run();
