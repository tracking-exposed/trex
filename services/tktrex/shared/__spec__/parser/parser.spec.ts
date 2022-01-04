import {
  isRight, map, mapLeft,
} from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';

import { ForYouVideoMetaData } from '../../src/models/MetaData';
import createServerSideParser from '../../src/parser/serverSideParser';
import historicData from './fixtures/history.json';

describe('The TikTok parser for the ForYou feed', () => {
  // first, filter the test samples that match the schema for
  // "foryou" videos so that we have complete data for our tests
  const forYouSamples = historicData.filter(
    (sample) => isRight(ForYouVideoMetaData.decode(sample.metadata)),
  );

  const { parseForYouVideo } = createServerSideParser();

  test.each(forYouSamples)('"foryou" with id "$id"', (sample) => {
    pipe(
      parseForYouVideo(sample.html),
      map((x) => {
        expect(sample.metadata).toMatchObject(x);
        expect(isRight(ForYouVideoMetaData.decode(x))).toBe(true);
      }),
      mapLeft((err) => {
        throw err;
      }),
    );
  });
});
