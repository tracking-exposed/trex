import {
  pipe,
} from 'fp-ts/lib/function';

import {
  expectToBeEitherLeft,
  expectToBeEitherRight,
} from '../../src/parser/v2/lib/util';

import {
  combineParsers,
  findElt,
  findEltText,
  parseEltText,
} from '../../src/parser/v2/parserUtil';

import {
  ServerDOM,
} from '../../src/parser/v2/ServerDOM';

describe('The parser util library', () => {
  const { parseHTML } = ServerDOM;

  describe('the "findElt" helper function', () => {
    it('finds an element in a dom', () => {
      const dom = parseHTML(`
        <div>
          <span>hello</span>
        </div>
      `);

      pipe(
        dom,
        findElt('span'),
        expectToBeEitherRight(
          (elt) => {
            expect(elt.textContent).toBe('hello');
          }),
      );
    });
  });

  describe('the "findEltText" helper function', () => {
    it('finds the text content of an element', () => {
      const dom = parseHTML(`
        <div>
          <span>hello</span>
        </div>
      `);

      pipe(
        dom,
        findEltText('span'),
        expectToBeEitherRight(
          (text) => {
            expect(text).toBe('hello');
          },
        ),
      );
    });

    it('returns an error if the text of the element is empty', () => {
      const dom = parseHTML(`
        <div>
          <span></span>
        </div>
      `);

      pipe(
        dom,
        findEltText('span'),
        expectToBeEitherLeft(),
      );
    });
  });

  describe('the "combineParsers" parser combinator', () => {

    const dom = parseHTML(`
      <div>
        <span>hello</span>
        <strong>world</strong>
        <div data-id="song">
          <h1 data-id="title">
            song.title
          </h1>
          <span data-id="artist">
            song.artist
          </span>
        </div>
      </div>
    `);

    const hello = parseEltText('span');
    const world = parseEltText('strong');

    const title = parseEltText('[data-id="title"]');
    const artist = parseEltText('[data-id="artist"]');

    const failing = parseEltText('[data-id="does-not-exist"]');

    it('combines two scalar parser into a parser for an object', () => {
      const parser = combineParsers({
        hello,
        world,
      });

      expect(parser(dom)).toHaveProperty('value', {
        hello: 'hello',
        world: 'world',
      });
    });

    it('creates parsers for nested objects', () => {
      const song = combineParsers({
        title,
        artist,
      });

      const parser = combineParsers({
        hello,
        world,
        song,
      });

      expect(parser(dom)).toHaveProperty('value', {
        hello: 'hello',
        world: 'world',
        song: {
          title: 'song.title',
          artist: 'song.artist',
        },
      });
    });

    it('collects the parse errors', () => {
      const parser = combineParsers({
        hello,
        failing,
      });

      const {
        errors,
        value,
      } = parser(dom);

      expect(value).toEqual({
        hello: 'hello',
      });

      expect(errors).toHaveLength(1);

      expect(errors[0]).toHaveProperty('missingFields', [
        'failing',
      ]);
    });

    it('collects the parse errors deeply', () => {
      const parser = combineParsers({
        hello,
        world,
        song: combineParsers({
          title,
          failing,
        }),
        test: combineParsers({
          oops: failing,
        }),
      });

      const { errors: [a, b] } = parser(dom);

      expect(a.missingFields).toEqual(['song.failing']);
      expect(b.missingFields).toEqual(['test.oops']);
    });
  });
});
