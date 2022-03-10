import { readFileSync } from 'fs';
import { join } from 'path';

import { createParser } from '../src/tikTokParser';

describe('Parsing a foryou feed', () => {
  describe('it parses the first item', () => {
    it('parses the first result of the collected feed', () => {
      const html = readFileSync(
        join(__dirname, '/fixtures/tt-foryou-basic/tt-foryou.html'),
        'utf8',
      );
      const expected = JSON.parse(
        readFileSync(
          join(__dirname, '/fixtures/tt-foryou-basic/expected.json'),
          'utf8',
        ),
      );
      const parser = createParser();
      const parsed = parser.parseForYouFeed(html);
      expect(parsed[0]).toEqual(expected[0]);
    });
  });
});
