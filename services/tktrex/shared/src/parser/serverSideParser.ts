import { Either, left } from 'fp-ts/lib/Either';

import { ForYouVideoMetaData } from '../models/MetaData';
import { TikTokParserServerInterface } from './TikTokParserInterface';
import { ParseError } from '../models/Error';

export const createParser = (): TikTokParserServerInterface => {
  const parseForYouVideo = (html: string): Either<
    ParseError,
    ForYouVideoMetaData
  > => {
    return left(new ParseError('parseForYouVideo not implemented'));
  };

  return {
    parseForYouVideo,
  };
};

export default createParser;
