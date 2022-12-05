#!/usr/bin/env ts-node
/* eslint-disable import/first */

import moduleAlias from 'module-alias';
moduleAlias({ base: process.cwd() });

import * as mongo3 from '@shared/providers/mongo.provider';
import { GetParserProvider } from '@shared/providers/parser.provider';
import { Ad } from '@yttrex/shared/models/Ad';
import { LeafSource } from '@yttrex/shared/parser';
import { parserConfig, YTParserConfig } from '@yttrex/shared/parser/config';
import { LeafParsers, leafParsers } from '@yttrex/shared/parser/parsers';
import fs from 'fs';
import _ from 'lodash';
import nconf from 'nconf';
import path from 'path';
import {
  addDom,
  getLastLeaves,
  getMetadata,
  toMetadata,
  updateAdvertisingAndMetadata,
} from '../lib/parser/leaf';
import { FixtureReporter } from '@shared/parser/reporters/FixtureReporter';

nconf.argv().env().file({ file: 'config/settings.json' });

const AMOUNT_DEFAULT = 20;
const BACKINTIMEDEFAULT = 1; // minutes
const FIXTURE_FOLDER = path.resolve(process.cwd(), '__tests__/fixtures/leaves');

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

    const mongoR = await mongo3.clientConnect({ maxConnecting: 1 });
    const mongoW = await mongo3.clientConnect({ maxConnecting: 1 });

    if (!mongoR || !mongoW) {
      throw new Error('Failed to connect to mongo!');
    }

    const db = {
      api: mongo3,
      read: mongoR,
      write: mongoW,
    };

    const errorReporter = FixtureReporter(FIXTURE_FOLDER);

    /* call the async infinite loop function */
    void GetParserProvider<
      typeof LeafSource,
      typeof Ad,
      YTParserConfig,
      LeafParsers
    >('leaves', {
      db,
      parsers: leafParsers,
      codecs: {
        contribution: LeafSource,
        metadata: Ad,
      },
      addDom,
      getEntryId: (e) => e.html.id,
      getContributions: getLastLeaves(db),
      getMetadata: getMetadata(db),
      getEntryDate: (e) => e.html.savingTime,
      getEntryNatureType: (e) => e.html.nature.type,
      buildMetadata: toMetadata,
      saveResults: updateAdvertisingAndMetadata(db),
      config: {
        ...parserConfig,
        errorReporter: errorReporter.report,
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
