#!/usr/bin/env ts-node
import * as _ from 'lodash';
import D from 'debug';
import * as fs from 'fs';
import { parseHTML } from 'linkedom';
import nconf from 'nconf';
import * as path from 'path';
import mongo3 from '../../../../packages/shared/src/providers/mongo.provider';
import { sanitizeHTML } from '../../../../packages/shared/src/utils/html.utils';

const cfgFile = 'config/settings.json';

nconf.argv().env().file({ file: cfgFile });

const logger = D('longlabel-fixtures');

const maxAmount = 33;
const skipAmount = 3;

async function main(): Promise<void> {
  nconf.set('mongoDb', 'yttrex');
  const mongoc = await mongo3.clientConnect({});

  logger('Mongo connected');

  const longlabPath = path.resolve(
    __dirname,
    path.join('..', '__tests__', 'fixtures', 'longlabels.json')
  );

  const aaa = [] as object[];
  for (const nature of ['home', 'video', 'search']) {
    const htmlobs = await mongo3.aggregate(
      mongoc as any,
      nconf.get('schema').htmls,
      [
        { $match: { 'nature.type': nature } },
        { $sort: { savingTime: -1 } },
        { $limit: maxAmount },
        { $skip: skipAmount },
      ]
    );

    logger('htmls available for nature "%s" is %d', nature, htmlobs.length);

    htmlobs.forEach((html) => {
      const jsdom = parseHTML(sanitizeHTML(html.html)).window.document;
      const labels = jsdom.querySelectorAll('[aria-label]');
      const worthy = _.uniq(
        _.reduce(
          labels,
          function (memo, l) {
            const ll = l.getAttribute('aria-label');
            if (!ll) return memo;
            // TODO source name should not provided by hand
            if (ll.length > 90) memo.push([ll, 'source', false]);
            return memo;
          },
          [] as object[]
        )
      );

      aaa.push(worthy);
      logger(
        'writing %d longlabels on %s (accumulator is %d)',
        worthy.length,
        longlabPath,
        aaa.length
      );
    });
  }
  const flattened = _.flatten(aaa);
  fs.appendFileSync(
    longlabPath,
    JSON.stringify(flattened, undefined, 1),
    'utf-8'
  );

  process.exit(1);
}

try {
  void main();
} catch (error) {
  // eslint-disable-next-line no-console
  console.log(error);
}
