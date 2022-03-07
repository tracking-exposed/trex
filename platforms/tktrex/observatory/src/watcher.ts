import { join, dirname } from 'path';
import { mkdir, readFile, writeFile, rename } from 'fs/promises';

import chokidar from 'chokidar';

import createParser from './tikTokParser';

const massPath = join(__dirname, '../mass');
const parsedPath = join(__dirname, '../parsed');
const maxWorkers = 10;

interface QueueItem {
  sourcePath: string;
  targetPath: string;
}

const queue: QueueItem[] = [];
let nWorkers = 0;

const spawnWorker = async(): Promise<void> => {
  while (nWorkers < maxWorkers && queue.length > 0) {
    const parser = createParser();

    const worker = async(item?: QueueItem): Promise<void> => {
      if (!item) {
        return Promise.resolve();
      }

      console.log(`[${nWorkers}] parsing: ${item.sourcePath}`);

      const mass = await readFile(item.sourcePath, 'utf8');
      const parsed = parser.parseForYouFeed(mass);
      await mkdir(dirname(item.targetPath), { recursive: true });
      await rename(item.sourcePath, item.targetPath);
      await writeFile(
        `${item.targetPath}.parsed.json`,
        JSON.stringify(parsed, null, 2),
      );
    };

    nWorkers += 1;
    worker(queue.shift())
      .then(() => {
        nWorkers -= 1;
        return spawnWorker();
      })
      .catch((err) => {
        console.error(err);
      });
  }
};

const main = async(): Promise<void> => {
  await mkdir(massPath, { recursive: true });
  await mkdir(parsedPath, { recursive: true });

  chokidar.watch(massPath).on('add', (path, entry) => {
    if (entry?.isFile()) {
      queue.push({
        sourcePath: path,
        targetPath: join(parsedPath, path.slice(massPath.length + 1)),
      });

      if (nWorkers < maxWorkers) {
        spawnWorker().catch((err) => {
          console.error(err);
        });
      }
    }
  });
};

void main();
