import { Either } from 'fp-ts/lib/Either';

import { ParseError } from '../models/Error';
import { ForYouVideoMetaData } from '../models/MetaData';

export type SearchableNode = Element | Document;

interface TikTokParserInterface<T extends string | SearchableNode> {
  parseForYouVideo: (input: T) => Either<ParseError, ForYouVideoMetaData>;
}

export interface TikTokParserServerInterface
  extends TikTokParserInterface<string> {}

export interface TikTokParserBrowserInterface
  extends TikTokParserInterface<SearchableNode> {}
