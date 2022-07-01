import { isLeft } from 'fp-ts/lib/Either';
import * as t from 'io-ts';
import { PathReporter } from 'io-ts/lib/PathReporter';

import log from '../logger';
import { bo } from '../utils/browser.utils';

const readJSON = async <C extends t.Any>(
  fileURL: string,
  codec: C
): Promise<C['_O']> => {
  const url = bo.runtime.getURL(fileURL);
  log.debug('Read json from: %O', url);
  const json = await fetch(url).then((r) => r.json());

  log.debug('Local json %O', json);
  const c = codec.decode(json);
  if (isLeft(c)) {
    const report = PathReporter.report(c);
    log.error('Decode failed: %O', report);
    throw new Error(report.join('\n'));
  }

  return c.right;
};

export default {
  readJSON,
};