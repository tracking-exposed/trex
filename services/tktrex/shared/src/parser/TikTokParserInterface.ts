import { ParseResult } from './parserUtil';

interface TikTokParserInterface<T extends string | Document> {
  parseForYouVideo: (input: T) => ParseResult;
  parseSearchVideo: (input: T) => ParseResult;
}

export interface TikTokParserServerInterface
  extends TikTokParserInterface<string> {}

export interface TikTokParserBrowserInterface
  extends TikTokParserInterface<Document> {}
