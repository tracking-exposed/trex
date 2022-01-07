import { flow } from 'fp-ts/lib/function';

import { TikTokParserServerInterface } from './TikTokParserInterface';
import { ServerDOM } from './ServerDOM';
import createBrowserSideParser from './browserSideParser';
import { ParseResult } from './parserUtil';

export const createParser = (): TikTokParserServerInterface => {
  const browserSideParser = createBrowserSideParser();

  const parseForYouVideo: (html: string) => ParseResult = flow(
    ServerDOM.parseHTML,
    browserSideParser.parseForYouVideo,
  );

  const parseSearchVideo: (html: string) => ParseResult = flow(
    ServerDOM.parseHTML,
    browserSideParser.parseSearchVideo,
  );

  return {
    parseForYouVideo,
    parseSearchVideo,
  };
};

export default createParser;
