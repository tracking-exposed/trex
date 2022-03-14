import { join, dirname, basename } from 'path';
import { mkdir, readFile, writeFile, rename } from 'fs/promises';
import { MongoClient, Collection } from 'mongodb';

import chokidar from 'chokidar';

import createParser from './tikTokParser';

import {
  massPath,
  parsedPath,
  maxParallelWorkers,
  MONGO_URL,
} from '../config/config';

interface QueueItem {
  sourcePath: string;
  targetPath: string;
}

const queue: QueueItem[] = [];
let nWorkers = 0;

const dispatchWorkers = async(collection: Collection): Promise<void> => {
  // eslint-disable-next-line no-unmodified-loop-condition
  while (nWorkers < maxParallelWorkers && queue.length > 0) {
    spawnWorker(collection).finally(() => {
      void dispatchWorkers(collection);
    });
  }
};

const spawnWorker = async(collection: Collection): Promise<void> => {
  const parser = createParser();

  const worker = async(item?: QueueItem): Promise<void> => {
    if (!item) {
      return Promise.resolve();
    }

    console.log(`[${nWorkers} workers] parsing: ${item.sourcePath}`);

    const mass = await readFile(item.sourcePath, 'utf8');
    const status = parser.parseCurlStatus(mass);

    if (status === 'success') {
      const parsed = parser.parseForYouFeed(mass);
      await mkdir(dirname(item.targetPath), { recursive: true });
      await rename(item.sourcePath, item.targetPath);
      const countryCode = basename(dirname(item.sourcePath));
      const creationTime = parseInt(basename(item.sourcePath));

      const result = parsed.map((data, videoOrder) => ({
        ...data,
        countryCode,
        creationTime: new Date(creationTime),
        order: videoOrder + 1,
      }));

      if (parsed.length > 0) {
        await writeFile(
          `${item.targetPath}.parsed.json`,
          JSON.stringify(result, null, 2),
        );

        await collection.insertMany(result);
      }
    } else {
      const countryCode = basename(dirname(item.sourcePath));
      const creationTime = parseInt(basename(item.sourcePath));

      const error = {
        type: 'Error',
        status,
        countryCode,
        creationTime,
      }

      await collection.insertOne(error);
    }

    void dispatchWorkers(collection);
  };

  nWorkers += 1;
  worker(queue.shift()).finally(() => {
    nWorkers -= 1;
    void dispatchWorkers(collection);
  });
};

const main = async(): Promise<void> => {
  await mkdir(massPath, { recursive: true });
  await mkdir(parsedPath, { recursive: true });

  const dbClient = await MongoClient.connect(MONGO_URL);
  const db = dbClient.db('observatory');
  const collection = db.collection('metadata');

  // this console print is helpful in the case someone start this script without
  // knowing/remember what the script does. it would remind the main goal.
  console.log("Waiting for new files in", massPath);
  chokidar.watch(massPath).on('add', (path, entry) => {
    if (entry?.isFile()) {
      queue.push({
        sourcePath: path,
        targetPath: join(parsedPath, path.slice(massPath.length + 1)),
      });

      void dispatchWorkers(collection);
    }
  });
};

void main();
