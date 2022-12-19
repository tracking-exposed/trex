import { isRight } from 'fp-ts/lib/Either';
import { PathReporter } from 'io-ts/lib/PathReporter';

import {
  expectToBeIncludedIn,
  normalizeDeepStrings,
} from '../../src/parser/v2/lib/util';
import { ForYouMetadata } from '../../src/models/metadata/ForYouMetadata';
import createServerSideParser from '../../src/parser/v2/serverSideParser';
import historicData from './fixtures/history.json';
import { v4 as uuid } from 'uuid';
// import { trexLogger } from '@shared/logger';

describe('The TikTok parser for the ForYou feed', () => {
  // first, filter the test samples that match the schema for
  // "foryou" videos so that we have complete data for our tests,
  // and exclude the example that we know to be wrong
  const forYouSamples = historicData.filter((sample) => {
    const decodeResult = ForYouMetadata.decode({
      ...sample.metadata,
      nature: { type: sample.metadata.type },
      timelineId: `bread-${uuid()}`,
    });
    // trexLogger.debug(
    //   'for you sample decode: %O',
    //   PathReporter.report(decodeResult)
    // );
    return isRight(decodeResult);
  });

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
    const validation = ForYouMetadata.decode({
      id: uuid(),
      savingTime: new Date().toISOString(),
      publicKey: 'fake-publicKey',
      nature: { type: 'foryou' },
      timelineId: `bread-${uuid()}`,
      ...(actual as any),
    });

    if (!isRight(validation)) {
      const report = PathReporter.report(validation);
      throw new Error(
        ['expected valid ForYouVideoMetaData:', ...report].join('\n'),
      );
    }
  });
});
