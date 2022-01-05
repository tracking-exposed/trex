import { isRight } from 'fp-ts/lib/Either';

import {
  expectToBeIncludedIn,
  expectToBeEitherRight,
  normalizeDeepStrings,
} from '../../src/lib/util';
import { ForYouVideoMetaData } from '../../src/models/MetaData';
import createServerSideParser from '../../src/parser/serverSideParser';
import historicData from './fixtures/history.json';

describe('The TikTok parser for the ForYou feed', () => {
  // first, filter the test samples that match the schema for
  // "foryou" videos so that we have complete data for our tests,
  // and exclude the example that we know to be wrong
  const forYouSamples = historicData.filter(
    (sample) =>
      isRight(ForYouVideoMetaData.decode(sample.metadata))
      && sample.metadata.hashtags
      && !sample.metadata.hashtags.some((tag) => !tag.startsWith('#')),
  );

  const { parseForYouVideo } = createServerSideParser();

  // then run the tests on all the samples we deem valid
  test.each(forYouSamples)('"foryou" with id "$id"', (sample) => {
    expectToBeEitherRight(
      expectToBeIncludedIn(
        // trim the strings in the sample metadata to
        // avoid irrelevant errors
        normalizeDeepStrings(
          sample.metadata,
        ),
      ),
    )(parseForYouVideo(sample.html));
  });
});
