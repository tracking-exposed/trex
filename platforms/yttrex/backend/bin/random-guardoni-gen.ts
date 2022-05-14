#!/usr/bin/env ts-node

import * as _ from 'lodash';
import D from 'debug';
import nconf from 'nconf';
import mongo3 from '../lib/mongo3';
import { produceCSVv1 } from 'lib/CSV';
import { writeFileSync } from 'fs';

const cfgFile = 'config/settings.json';

nconf.argv().env().file({ file: cfgFile });

const logger = D('random-guardoni-gen');

function shuffleIf(list) {
  if(!nconf.get('shuffle')) 
    return list;

  logger('shuffling %j', list);
  return _.shuffle(list);
}

function returnHomeCSVinputs(amount) {

  return _.times(amount, function(i) {
    return {
      watchFor: 10000,
      title: `title - yt home ${i} `,
      urlTag: `tag - yt home ${i} `,
      url: 'https://www.youtube.com/'
    }
  });
}

function returnSearchesCSVinputs(input, amount) {
  const queries = shuffleIf(_.uniq(_.map(input, 'query')));
  logger('picken unique queries: %j', queries);
  return _.times(amount, function(i) {
    const q = queries.pop();
    return {
      title: `search ${q} ${i}`,
      watchFor: 10000,
      urlTag: `tag - search ${i}`,
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`
    }
  });

}

function returnVideosCSVinputs(input, amount) {
  const videos = shuffleIf(_.flatten(_.map(input, function(smeta) {
    return _.map(smeta.results, function(ventry) {
      return _.pick(ventry, ['href', 'title']);
    });
  })));
  return _.times(amount, function(i) {
    const v = videos.pop();
    return {
      title: v.title,
      watchFor: 60000,
      urlTag: `tag - video ${v.title} ${i}`,
      url: `https://www.youtube.com${v.href}`
    }
  });
}

async function main(): Promise<void> {
  const mongoc = await mongo3.clientConnect({});
  if(!mongoc)
    return console.log("Impossible to open a mongodb connection");

  logger('Mongo connected, now querying %s', nconf.get('schema').metadata);

  const input = await mongo3.readLimit(
    mongoc, nconf.get('schema').metadata, { type: 'search'}, { savingTime: -1 }, 5, 0);
  logger('picked %d searches', input.length);

  const homes = returnHomeCSVinputs(2);
  const videos = returnVideosCSVinputs(input, 4);
  const searches = returnSearchesCSVinputs(input, 3);

  const final = _.map(_.concat(
    searches[0], homes[0], videos[0],
    searches[1], homes[1], videos[1]));
  const guardoniCSV = produceCSVv1(final);
  console.log(guardoniCSV);
  if(nconf.get('save')) {
    logger(`saving CSV in ${nconf.get('save')}`);
    writeFileSync(nconf.get('save'), guardoniCSV, 'utf-8');
  }
  await mongoc.close();
  process.exit(0)
}

try {
  void main();
} catch (error) {
  // eslint-disable-next-line no-console
  console.log(error);
}
