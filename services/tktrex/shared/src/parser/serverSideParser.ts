import { Either } from 'fp-ts/lib/Either';
import { flow } from 'fp-ts/lib/function';

import { ForYouVideoMetaData } from '../models/MetaData';
import { TikTokParserServerInterface } from './TikTokParserInterface';
import { ParseError } from '../models/Error';
import { ServerDOM } from './ServerDOM';
import createBrowserSideParser from './browserSideParser';

export const createParser = (): TikTokParserServerInterface => {
  const browserSideParser = createBrowserSideParser();

  const parseForYouVideo: (html: string) => Either<
    ParseError,
    ForYouVideoMetaData
  > = flow(
    ServerDOM.parseHTML,
    browserSideParser.parseForYouVideo,
  );

  return {
    parseForYouVideo,
  };
};

export default createParser;
