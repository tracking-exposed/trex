import { normalizeDeepStrings } from '../src/lib/util';

describe('The util library', () => {
  describe('The normalize function', () => {
    it('trims a string', () => {
      expect(normalizeDeepStrings('  foo  ')).toBe('foo');
    });

    it('trims strings within an array', () => {
      expect(normalizeDeepStrings(['  foo  ', 'bar  ']))
        .toEqual(['foo', 'bar']);
    });

    it('trims strings within nested arrays', () => {
      expect(normalizeDeepStrings([['  foo  ', ['bar  ']]]))
        .toEqual([['foo', ['bar']]]);
    });

    it('trims strings in object property values', () => {
      expect(normalizeDeepStrings({ foo: '  foo  ' }))
        .toEqual({ foo: 'foo' });
    });

    it('trims deeply nested strings within arrays and objects', () => {
      expect(normalizeDeepStrings({
        foo: [
          '  foo  ',
          {
            bar: '  bar  ',
            baz: ['  baz  ', ['  qux  ', { quux: '  quux' }]],
          },
        ],
      })).toEqual(
        {
          foo: [
            'foo',
            {
              bar: 'bar',
              baz: ['baz', ['qux', { quux: 'quux' }]],
            },
          ],
        },
      );
    });

    it('removes extraneous whitespace in the middle of a string', () => {
      expect(normalizeDeepStrings('  foo  bar  ')).toBe('foo bar');
    });
  });
});
