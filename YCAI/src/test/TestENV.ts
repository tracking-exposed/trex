import * as t from 'io-ts';
import { NumberFromString } from 'io-ts-types/lib/NumberFromString';

export const TestENV = t.strict(
  {
    PUPPETEER_SLOW_MO: NumberFromString,
    PUPPETEER_EXEC_PATH: t.string,
  },
  'TestENV'
);

export type TestENV = t.TypeOf<typeof TestENV>;
