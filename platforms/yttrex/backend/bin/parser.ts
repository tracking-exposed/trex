#!/usr/bin/env ts-node
/* eslint-disable import/first */

// eslint-disable-next-line @typescript-eslint/no-var-requires
require('module-alias')({ base: process.cwd() });

import { FixtureReporter } from '@shared/parser/reporters/FixtureReporter';
import * as mongo3 from '@shared/providers/mongo.provider';
import fs from 'fs';
import _ from 'lodash';
import nconf from 'nconf';
import {
  getLastHTMLs,
  updateMetadataAndMarkHTML,
  addDom,
  getMetadata,
} from '../lib/parser/html';
import { parserConfig } from '@yttrex/shared/parser/config';
import { GetParserProvider } from '@shared/providers/parser.provider';
import { HTMLSource } from '@yttrex/shared/parser/source';
import { toMetadata } from '@yttrex/shared/parser/metadata';
import { parsers } from '@yttrex/shared/parser/parsers';
import path from 'path';
import { MetadataDB } from '../models/metadata';

nconf.argv().env().file({ file: 'config/settings.json' });

const AMOUNT_DEFAULT = 20;
const BACKINTIMEDEFAULT = 1;
const FIXTURES_FOLDER = path.resolve(process.cwd(), '__tests__/fixtures/htmls');

/*
 * A function to retrieve htmls by filter and amount
 */

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

    const errorReporter = FixtureReporter(FIXTURES_FOLDER);

    /* call the async infinite loop function */
    void GetParserProvider('htmls', {
      db,
      codecs: {
        contribution: HTMLSource,
        metadata: MetadataDB,
      },
      parsers,
      getMetadata: getMetadata(db),
      getContributions: getLastHTMLs(db),
      addDom,
      getEntryId: (e) => e.html.id,
      getEntryDate: (e) => e.html.savingTime,
      getEntryNatureType: (e) => e.html.nature.type,
      buildMetadata: toMetadata,
      saveResults: updateMetadataAndMarkHTML(db),
      config: {
        ...parserConfig,
        errorReporter: errorReporter.report,
      },
    })
      .run({
        singleUse: typeof id === 'string' ? id : false,
        filter,
        stop,
        repeat,
        backInTime,
        htmlAmount,
      })
      .then(() => {
        // eslint-disable-next-line
        console.log('Parser closed.');
        process.exit(0);
      });
  } catch (e) {
    // eslint-disable-next-line
    console.log('Error in wrapperLoop', e.message);
    process.exit(1);
  }
};

void run();
