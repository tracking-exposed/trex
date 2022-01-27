import crypto from 'crypto';

import { isLeft } from 'fp-ts/lib/Either';
import { PathReporter } from 'io-ts/lib/PathReporter';

import PouchDB from 'pouchdb';
import pouchFind from 'pouchdb-find';

import { Snapshot } from '../scraper';
import { generateDirectoryStructure } from '@project/index';

PouchDB.plugin(pouchFind);

export interface Db {
  save: (snapshot: Snapshot) => Promise<void>;
  findAllSnapshots: () => Promise<Snapshot[]>;
}

export const init = async(projectDirectory: string): Promise<Db> => {
  const { databaseDirectory } = generateDirectoryStructure(projectDirectory);
  const pouch = new PouchDB(databaseDirectory);

  await pouch.createIndex({
    index: {
      fields: ['type'],
    },
  });

  const findAllSnapshots = async(): Promise<Snapshot[]> => {
    const results = await pouch.find({
      selector: {
        type: 'Snapshot',
      },
    });

    const docs = results.docs.map(({ _rev, ...snapshot }) => snapshot);
    const snapshots: Snapshot[] = [];

    for (const doc of docs) {
      const validation = Snapshot.decode(doc);

      if (isLeft(validation)) {
        throw new Error(
          [
            'Database seems to be corrupted:',
            ...PathReporter.report(validation),
          ].join('\n'),
        );
      }

      snapshots.push(validation.right);
    }

    return snapshots;
  };

  const save = async(snapshot: Snapshot): Promise<void> => {
    const _id = crypto
      .createHash('sha256')
      .update(JSON.stringify(snapshot))
      .digest('hex');

    await pouch.put({ ...snapshot, _id });
  };

  return {
    findAllSnapshots,
    save,
  };
};

export default init;
