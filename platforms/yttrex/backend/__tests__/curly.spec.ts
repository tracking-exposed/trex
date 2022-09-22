import fetchMock from 'jest-fetch-mock';
import { recentVideoFetch } from '../lib/curly';
import initialData from './fixtures/ytInitialData.json';

describe('The recentVideoFetch function', () => {
  beforeAll(() => {
    fetchMock.enableMocks();
  });
  it('retrieves the videos from tracking-exposed', async () => {
    fetchMock.mockResponseOnce(`
      <script>
        var ytInitialData = ${initialData};
      </script>
    `);
    const videos = await recentVideoFetch('UCZQ6RK_b9grwh1V9zdo3exA');
    expect(videos.length).toBeGreaterThanOrEqual(3);
  });
});
