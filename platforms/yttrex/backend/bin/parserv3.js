#!/usr/bin/env node

/* eslint-disable */

const _ = require('lodash');
const nconf = require('nconf');
const fs = require('fs');
const { GetParserProvider } = require('../lib/parser.provider');
const mongo3 = require('../lib/mongo3');
const { run } = require('fp-ts/lib/ReaderTask');
const { parsers } = require('../parsers');
const { Metadata } = require('../models/Metadata');

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

  function toMetadata(entry) {
    parserLog.debug('Metadata from %O', entry);
    // this contains the original .source (html, impression, timeline), the .findings and .failures
    // the metadata is aggregated by unit and not unrolled in any way
    if (!entry.findings?.nature) return null;

    if (entry.findings.nature.type === 'search') {
      const metadata = {
        ...entry.findings.nature,
        ...entry.findings.downloader,
        ...entry.findings.search,
      };
      metadata.savingTime = new Date(entry.source.html.savingTime);
      metadata.id = entry.source.html.id;
      metadata.publicKey = entry.source.html.publicKey;
      return metadata;
    }

    /* else ... */
    const metadata = {
      ...entry.findings.nature,
      ...entry.findings.description,
      ...entry.findings.music,
      ...entry.findings.hashtags,
      ...entry.findings.numbers,
      ...entry.findings.stitch,
      ...entry.findings.author,
      ...entry.findings.downloader,
    };

    metadata.savingTime = new Date(entry.source.html.savingTime);
    metadata.id = entry.source.html.id;
    metadata.publicKey = entry.source.html.publicKey;
    metadata.timelineId = entry.source.html.timelineId;
    metadata.order = entry.source.html.n[0];
    // from routes/events.js the 0 is videoCounter, client side
    return metadata;
  }

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
      id,
      filter,
      stats,
      stop,
      repeat: actualRepeat,
      singleUse,
    });
  } catch (e) {
    console.log('Error in wrapperLoop', e.message);
    process.exit(1);
  }
};

void run();
