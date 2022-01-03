import {
  isRight, map, mapLeft,
} from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';

import { ForYouVideoMetaData } from '../../src/models/MetaData';
import parse from '../../src/parser';
import historicData from './fixtures/history.json';

describe('The TikTok parser for the ForYou feed', () => {
  // first, filter the test samples that match the schema for
  // "foryou" videos so that we have complete data for our tests
  const forYouSamples = historicData.filter(
    (sample) => isRight(ForYouVideoMetaData.decode(sample.metadata)),
  );

  test.each(forYouSamples)('"foryou" with id "$id"', (sample) => {
    pipe(
      parse(sample.html),
      map((x) => expect(x).toEqual(sample.metadata)),
      mapLeft((err) => {
        throw err;
      }),
    );
  });
});
