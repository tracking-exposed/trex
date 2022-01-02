import { getNatureByHref } from '../src/lib/nature';
import { URLError } from '../src/models/Error';

describe('The tiktok "Nature" utilities', () => {
  describe('the getNatureByHref function', () => {
    it('throws an "URLError" if the page is not from "tiktok.com"', () => {
      expect(() => getNatureByHref('https://example.com')).toThrow(
        new URLError('URL is not from tiktok', new URL('https://example.com')),
      );
    });

    it('recognizes the "tiktok.com" homepage as "foryou"', () => {
      expect(getNatureByHref('https://www.tiktok.com/')).toEqual({
        type: 'foryou',
      });
    });

    it('recognizes the "tiktok.com/fr" homepage as "foryou"', () => {
      expect(getNatureByHref('https://www.tiktok.com/fr')).toEqual({
        type: 'foryou',
      });
    });

    it('recognizes the tiktok following page', () => {
      expect(getNatureByHref('https://www.tiktok.com/following')).toEqual({
        type: 'following',
      });
    });

    it('recognizes a video page', () => {
      const href = 'https://www.tiktok.com/@lilou.grmmspam/video/7039026679003499782?is_copy_url=1&is_from_webapp=v1';
      expect(getNatureByHref(href)).toEqual({
        type: 'video',
        authorId: '@lilou.grmmspam',
        videoId: '7039026679003499782',
      });
    });

    it('recognizes a creator page', () => {
      const href = 'https://www.tiktok.com/@lilou.grmmspam';
      expect(getNatureByHref(href)).toEqual({
        type: 'creator',
        creatorName: '@lilou.grmmspam',
      });
    });

    it('recognizes a search page', () => {
      const href = 'https://www.tiktok.com/search?q=%C3%A9lections&t=1641131268096';
      expect(getNatureByHref(href)).toEqual({
        type: 'search',
        query: 'élections',
        timestamp: '1641131268096',
      });
    });
  });
});
