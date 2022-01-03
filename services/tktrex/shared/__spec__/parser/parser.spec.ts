import historicData from './fixtures/history.json';

describe('The TikTok parser for the ForYou feed', () => {
  const forYouSamples = historicData.filter(
    (sample) => sample.metadata.type === 'foryou',
  );

  test.each(forYouSamples)('"foryou" with id "$id"', (sample) => {
    throw new Error('test not implemented yet');
  });
});
