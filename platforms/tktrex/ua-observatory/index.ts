/* eslint-disable no-console */

import {
  fetchPage,
  parsePage,
} from './lib';

const url = process.argv[2];

if (!url) {
  console.error('Usage: ts-node index.ts <url>');
  process.exit(1);
}

const main = async (): Promise<void> => {
  const html = fetchPage(url);
  const parsed = parsePage(html);
  console.log(parsed);
};

main().catch(err => {
  console.error(err);
  process.exit(1);
});
