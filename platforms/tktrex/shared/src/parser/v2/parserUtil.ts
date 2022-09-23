import {
  pipe,
} from 'fp-ts/lib/function';

import {
  chain, isRight, left, right,
  Either,
} from 'fp-ts/lib/Either';

import {
  normalizeString,
} from './lib/util';
import { ParseError } from './models/Error';

type SearchableNode = Document | Element;

export const findElt = (selector: string) =>
  (node: SearchableNode): Either<ParseError, SearchableNode> => {
    const elt = node.querySelector(selector);

    if (!elt) {
      return left(new ParseError(`could not find element with selector "${selector}"`));
    }

    return right(elt);
  };

export const findAllElts = (selector: string) =>
  (node: SearchableNode): Either<ParseError, Element[]> =>
    right([...node.querySelectorAll(selector)]);

export const findEltText = (selector: string) =>
  (node: SearchableNode): Either<ParseError, string> =>
    pipe(
      node,
      findElt(selector),
      chain((elt) => {
        const text = normalizeString(elt.textContent);

        if (!text) {
          return left(
            new ParseError(
              `text content of element with selector "${selector}" is empty`,
            ),
          );
        }

        return right(text);
      }),
    );

export const findEltAttrText = (selector: string, attr: string) =>
  (node: SearchableNode): Either<ParseError, string> =>
    pipe(
      node,
      findElt(selector),
      chain((elt) => {
        const txt = normalizeString((elt as any)[attr]);

        if (!txt) {
          return left(
            new ParseError(
              `attribute "${attr}" of element with selector "${selector}" is empty`,
            ),
          );
        }

        return right(txt);
      }),
    );

export type ScrapedValue = undefined | string | string[] | ScrapedObject;
export interface ScrapedObject {
  [key: string]: ScrapedValue
};

export interface ParseResult<V extends ScrapedValue = ScrapedValue>{
  value: V;
  errors: ParseError[];
}

export type Parser <V extends ScrapedValue = ScrapedValue> = (node: SearchableNode) =>
  ParseResult<V>;

export const liftParser = (p: (node: SearchableNode) => Either<ParseError, ScrapedValue>) =>
  (node: SearchableNode): ParseResult<ScrapedValue> => {
    const result = p(node);

    if (isRight(result)) {
      return {
        value: result.right,
        errors: [],
      };
    }

    return {
      value: undefined,
      errors: [result.left],
    };
  };

const updateErrorPath = (key: string) => (errs: ParseError[]) =>
  errs.map((err) => {
    if (err.missingFields.length === 0) {
      err.addMissingField(key);
    } else {
      err.missingFields = err.missingFields.map(
        (field) => `${key}.${field}`,
      );
    }

    return err;
  });

export const combineParsers = (parsers: { [key: string]: Parser }): Parser =>
  (node: SearchableNode): ParseResult<ScrapedObject> =>
    Object.entries(parsers).reduce(
      (
        acc: ParseResult<ScrapedObject>,
        [key, parser]: [string, Parser],
      ): ParseResult<ScrapedObject> => {
        const result = parser(node);

        if (result.errors.length > 0) {
          return {
            ...acc,
            errors: [
              ...acc.errors,
              ...updateErrorPath(key)(result.errors),
            ],
          };
        }

        return {
          ...acc,
          value: {
            ...acc.value,
            [key]: result.value,
          },
        };
      },
      { value: {}, errors: [] },
    );

export const parseEltText = (selector: string): Parser =>
  liftParser(findEltText(selector));

export const parseEltAttrText = (
  selector: string,
  attr: string,
): Parser => liftParser(findEltAttrText(selector, attr));

export const parseAlways = <V extends ScrapedValue>(value: V): Parser =>
  (): ParseResult<V> => ({
    value,
    errors: [],
  });

export const mapValue = <
  V extends ScrapedValue,
  R extends ScrapedValue,
>(fn: (v: V) => R) => (parser: Parser<V>) =>
    (node: SearchableNode): ParseResult<R> => {
      const result = parser(node);

      return {
        value: fn(result.value),
        errors: result.errors,
      };
    };
