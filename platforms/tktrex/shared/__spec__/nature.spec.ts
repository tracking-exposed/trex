import { Either, left, right } from 'fp-ts/lib/Either';
import { getNatureByHref } from '../src/parser/parsers/nature';
import { URLError } from '../src/parser/v2/models/Error';
import { Nature } from '../src/models/Nature';

describe('The tiktok "Nature" utilities', () => {
  describe('the getNatureByHref function', () => {
    interface Scenario {
      description: string;
      href: string;
      expected: Either<URLError, Nature>;
    }

    const scenari: Scenario[] = [
      {
        description:
          'throws an "URLError" if the page is not from "tiktok.com"',
        href: 'https://example.com',
        expected: left(
          new URLError('URL is not from tiktok', new URL('https://example.com')),
        ),
      },
      {
        description: 'recognizes the "tiktok.com" homepage as "foryou"',
        href: 'https://www.tiktok.com/',
        expected: right({ type: 'foryou' }),
      },
      {
        description: 'recognizes the "tiktok.com/fr" homepage as "foryou"',
        href: 'https://www.tiktok.com/fr',
        expected: right({ type: 'foryou' }),
      },
      {
        description: 'recognizes the tiktok following page',
        href: 'https://www.tiktok.com/following',
        expected: right({ type: 'following' }),
      },
      {
        description: 'recognizes a video page',
        href: 'https://www.tiktok.com/@lilou.grmmspam/video/7039026679003499782?is_copy_url=1&is_from_webapp=v1',
        expected: right({
          type: 'native',
          authorId: '@lilou.grmmspam',
          videoId: '7039026679003499782',
        }),
      },
      {
        description: 'recognizes a creator page',
        href: 'https://www.tiktok.com/@lilou.grmmspam',
        expected: right({
          type: 'creator',
          creatorName: '@lilou.grmmspam',
        }),
      },
      {
        description: 'recognizes a search page',
        href: 'https://www.tiktok.com/search?q=%C3%A9lections&t=1641131268096',
        expected: right({
          type: 'search',
          query: 'élections',
          timestamp: '1641131268096',
        }),
      },
    ];

    test.each(scenari)('$description', ({ href, expected }) => {
      const actual = getNatureByHref(href);
      expect(actual).toEqual(expected);
    });
  });
});
