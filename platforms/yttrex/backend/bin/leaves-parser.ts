#!/usr/bin/env ts-node

import fs from 'fs';
import {
  getLastLeaves,
  updateAdvertisingAndMetadata,
} from '../lib/parser/leaf';
import _ from 'lodash';
import nconf from 'nconf';
import mongo3 from '../lib/mongo3';
import { GetParserProvider } from '../lib/parser/parser';
import { Leaf } from '../models/Leaf';
import { processLeaf } from '../parsers/leaf';
import { leafParsers } from '../parsers';

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

    const db = {
      api: mongo3,
      read: mongoR,
      write: mongoW,
    };

    /* call the async infinite loop function */
    void GetParserProvider<Leaf>({
      db,
      parsers: leafParsers,
      getContributions: getLastLeaves({ db }),
      getEntryDate: (e) => e.savingTime,
      getEntryNatureType: (e) => e.nature.type,
      saveResults: async (r) => {
        if (r) {
          const ad = processLeaf(r.source);
          if (ad) {
            await updateAdvertisingAndMetadata({ db })({
              source: ad,
              failures: {},
              log: {},
              findings: {},
            });
          }
        }
        return null;
      },
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
