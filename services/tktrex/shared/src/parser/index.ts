import {
  Either, left,
} from 'fp-ts/lib/Either';

import { ParseError } from '../models/Error';
import { MetaData } from '../models/MetaData';

export const parse = (html: string): Either<ParseError, MetaData> => {
  return left(new ParseError('not implemented'));
};
