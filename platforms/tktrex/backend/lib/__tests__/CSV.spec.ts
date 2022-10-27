import { fc } from '@shared/test';
import {
  NativeMetadataArb,
  SearchMetaDataArb,
} from '@tktrex/shared/arbitraries/Metadata.arb';
import CSV from '../CSV';

describe('lib/CSV.ts', () => {
  describe('unroll nested search', () => {
    const keysToHave = [
      'videoId',
      'authorId',
      'savingTime',
      'metadataId',
      'order',
      'query',
      'pseudo',
      'thumbfile',
      'savingTime',
      'publishingDate',
      'timeago',
      'tags',
      'authorId',
      'videoId',
    ];
    const keysToOmit = ['researchTag', 'experimentId', 'publicKey', '_id'];

    test('should return flatten searches without "researchTag" nor "experimentId"', () => {
      const resultsCount = 10;
      const searchCount = 2;
      const searches = fc
        .sample(SearchMetaDataArb({ results: resultsCount }), searchCount)
        .map((s) => ({ ...s, publicKey: '' }));

      const results = CSV.unrollNested(searches, { type: 'search' });
      expect(results).toHaveLength(resultsCount * searchCount);

      results.forEach((r) => {
        keysToOmit.forEach((k) => {
          expect(r).not.toHaveProperty(k);
        });
        keysToHave.forEach((k) => {
          expect(r).toHaveProperty(k);
        });
      });
    });

    test('should return flatten searches with "experimentId" and "researchTag"', () => {
      const resultsCount = 10;
      const searchCount = 2;
      const researchTag = 'research-tag';
      const experimentId = 'experiment-id';
      const searches = fc
        .sample(SearchMetaDataArb({ results: resultsCount }), searchCount)
        .map((s) => ({ ...s, publicKey: '', researchTag, experimentId }));

      const results = CSV.unrollNested(searches, {
        type: 'search',
        experiment: true,
        private: true,
      });

      expect(results).toHaveLength(resultsCount * searchCount);

      results.forEach((r) => {
        keysToOmit
          .filter((k) => !['researchTag', 'experimentId'].includes(k))
          .forEach((k) => {
            expect(r).not.toHaveProperty(k);
          });
        keysToHave.forEach((k) => {
          expect(r).toHaveProperty(k);
        });
      });
    });
  });
  describe('unroll native', () => {
    const keysToHave = ['videoId', 'authorId', 'savingTime'];
    const keysToOmit = ['researchTag', 'experimentId', 'publicKey', '_id'];

    test('should return flatten native without "researchTag" nor "experimentId"', () => {
      const resultsCount = 1;
      const metadataCount = 2;
      const searches = fc.sample(NativeMetadataArb, metadataCount).map((s) => ({
        ...s,
        publicKey: '',
      }));

      const results = CSV.unrollNested(searches, { type: 'native' });
      expect(results).toHaveLength(resultsCount * metadataCount);

      results.forEach((r) => {
        keysToOmit.forEach((k) => {
          expect(r).not.toHaveProperty(k);
        });
        keysToHave.forEach((k) => {
          expect(r).toHaveProperty(k);
        });
      });
    });

    test('should return flatten native with "experimentId" and "researchTag"', () => {
      const resultsCount = 1;
      const metadataCount = 2;
      const researchTag = 'research-tag';
      const experimentId = 'experiment-id';
      const searches = fc
        .sample(NativeMetadataArb, metadataCount)
        .map((s) => ({ ...s, publicKey: '', researchTag, experimentId }));

      const results = CSV.unrollNested(searches, {
        type: 'native',
        experiment: true,
        private: true,
      });

      expect(results).toHaveLength(resultsCount * metadataCount);

      results.forEach((r) => {
        keysToOmit
          .filter((l) => !['researchTag', 'experimentId'].includes(l))
          .forEach((k) => {
            expect(r).not.toHaveProperty(k);
          });
        keysToHave.forEach((k) => {
          expect(r).toHaveProperty(k);
        });
      });
    });
  });
});
