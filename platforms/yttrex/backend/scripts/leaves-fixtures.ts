#!/usr/bin/env ts-node

import D from 'debug';
import * as fs from 'fs';
import nconf from 'nconf';
import * as path from 'path';
import mongo3 from '../lib/mongo3';

const cfgFile = 'config/settings.json';

nconf.argv().env().file({ file: cfgFile });

const logger = D('leaves-fixtures');

async function main(): Promise<void> {
  nconf.set('mongoDb', 'yttrex-2');
  const mongoc = await mongo3.clientConnect({});

  logger('Mongo connected');

  const fixturePath = path.resolve(__dirname, `../__tests__/fixtures`);

  // if (fs.existsSync(fixturePath)) {
  //   fs.rmSync(fixturePath, { recursive: true });
  // }

  const fixturesP = ['home', 'video', 'search'].map(async (n) => {
    const metadataWithHTMLS = await mongo3.aggregate(
      mongoc,
      nconf.get('schema').metadata,
      [
        // { $match: { 'nature.type': n } },
        { $sort: { savingTime: -1 } },
        {
          $lookup: {
            from: 'leaves',
            localField: 'id',
            foreignField: 'metadataId',
            as: 'leaves',
          },
        },
        {
          $match: {
            'leaves.nature.type': n,
            leaves: {
              $exists: true,
              $not: {
                $size: 0,
              },
            },
          },
        },
      ]
    );

    logger('Metadata %O', metadataWithHTMLS);
    // logger(
    //   'HTML metadata %O',
    //   metadataWithHTMLS.flatMap((m) => ({
    //     metadataId: m.htmls.flatMap((h) => h.metadataId),
    //     nature: m.htmls.flatMap((h) => h.nature),
    //   }))
    // );

    // logger(
    //   'Metadata first html %O',
    //   metadataWithHTMLS?.flatMap((m) => m.htmls[0])
    // );

    metadataWithHTMLS.forEach(({ leaves, ...metadata }) => {
      // logger('HTML metadata %O', metadata);
      const basePath = path.resolve(fixturePath, 'leaves', n);
      if (!fs.existsSync(basePath)) {
        fs.mkdirSync(basePath, { recursive: true });
      }

      fs.writeFileSync(
        path.resolve(basePath, `${metadata.id}.json`),
        JSON.stringify({
          leaves,
          metadata: metadata,
        })
      );
    });
  });

  await Promise.all(fixturesP);
  process.exit(0);
}

try {
  void main();
} catch (error) {
  // eslint-disable-next-line no-console
  console.log(error);
}
