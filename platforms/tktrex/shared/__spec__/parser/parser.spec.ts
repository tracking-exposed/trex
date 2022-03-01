import { isRight } from 'fp-ts/lib/Either';
import { PathReporter } from 'io-ts/lib/PathReporter';

import {
  expectToBeIncludedIn,
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
      isRight(ForYouVideoMetaData.decode(sample.metadata)),
  );

  const { parseForYouVideo } = createServerSideParser();

  // then run the tests on all the samples we deem valid
  test.each(forYouSamples)('"foryou" with id "$id"', (sample) => {
    const expected = normalizeDeepStrings(sample.metadata);
    const { value: actual, errors } = parseForYouVideo(sample.html);

    expect(errors).toHaveLength(0);

    // check that the parsed object is included in the sample
    // (we only check for inclusion because the sample has
    // extraneous keys)
    expectToBeIncludedIn(expected)(actual);

    // because we only checked for the inclusion of the parsed value
    // inside the expected value,
    // now we also check that it validates the schema of the
    // expected value
    const validation = ForYouVideoMetaData.decode(actual);
    if (!isRight(validation)) {
      const report = PathReporter.report(validation);
      throw new Error([
        'expected valid ForYouVideoMetaData:',
        ...report,
      ].join('\n'));
    }
  });
});
