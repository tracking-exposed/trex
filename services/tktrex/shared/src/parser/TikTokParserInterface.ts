import { Either } from 'fp-ts/lib/Either';

import { ParseError } from '../models/Error';
import { ForYouVideoMetaData } from '../models/MetaData';

interface TikTokParserInterface<T = string | Node> {
  parseForYouVideo: (input: T) => Either<ParseError, ForYouVideoMetaData>;
}

export interface TikTokParserServerInterface
  extends TikTokParserInterface<string> {}

export interface TikTokParserBrowserInterface
  extends TikTokParserInterface<Node> {}
