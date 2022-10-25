import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
enableFetchMocks();
import { recentVideoFetch } from '../lib/curly';
import initialData from './fixtures/ytInitialData.json';

describe('The recentVideoFetch function', () => {
  beforeAll(() => {
    fetchMock.enableMocks();
  });
  afterAll(() => {
    fetchMock.disableMocks();
  });

  it.skip('retrieves the videos from tracking-exposed', async () => {
    fetchMock.mockResponseOnce(`
      <script>
        var ytInitialData = ${JSON.stringify(initialData)};
      </script>
    `);
    const videos = await recentVideoFetch('UCZQ6RK_b9grwh1V9zdo3exA');
    expect(videos.length).toBeGreaterThanOrEqual(3);
  });
});
