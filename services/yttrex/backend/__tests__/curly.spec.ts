import { recentVideoFetch } from '../lib/curly';

describe('The recentVideoFetch function', () => {
  it('retrieves the videos from tracking-exposed', async () => {
    const videos = await recentVideoFetch('UCZQ6RK_b9grwh1V9zdo3exA');
    expect(videos.length).toBeGreaterThanOrEqual(3);
  });
});
