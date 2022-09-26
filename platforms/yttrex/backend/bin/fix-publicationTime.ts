#!/usr/bin/env ts-node

import D from 'debug';
import * as fs from 'fs';
import moment from 'moment';
import nconf from 'nconf';
import * as path from 'path';
import * as longlabel from '@yttrex/shared/parser/parsers/longlabel';

const cfgFile = 'config/settings.json';

nconf.argv().env().file({ file: cfgFile });

const logger = D('fix-pubtime');

async function main(): Promise<void> {
  // nconf.set('mongoDb', 'yttrex-2');
  // const mongoc = await mongo3.clientConnect({});

  logger('Mongo connected');

  const fixturePath = path.resolve(__dirname, `../__tests__/fixtures`);

  [
    'home',
    //  'video', 'search'
  ].map((n) => {
    const files = fs
      .readdirSync(path.join(fixturePath, n))
      .filter((n) => n.includes('json'));

    logger('Metadata %O', files);

    const updates = files.map((id) => {
      const result = fs.readFileSync(path.join(fixturePath, n, id), 'utf-8');
      const content = JSON.parse(result);

      // fix publicationTime in selected
      const selected = content.metadata.selected.map((sel) => {
        let labelInfo;
        try {
          labelInfo = longlabel.parser(
            sel.label,
            sel.recommendedSource,
            sel.isLive
          );
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error(e);
        }

        return {
          ...sel,
          timePrecision: labelInfo?.timeago ? 'estimated' : 'error',
          publicationTime: labelInfo?.timeago
            ? moment(content.metadata.clientTime)
                .subtract(labelInfo.timeago)
                .toISOString()
            : sel.publicationTime,
        };
      });

      return {
        id,
        update: {
          ...content,
          metadata: {
            ...content.metadata,
            selected,
          },
        },
      };
    });

    return updates.map(({ id, update }) => {
      fs.writeFileSync(
        path.join(fixturePath, n, id),
        JSON.stringify(update, null, 2)
      );

      return undefined;
    });
  });

  process.exit(0);
}

try {
  void main();
} catch (error) {
  // eslint-disable-next-line no-console
  console.log(error);
}
