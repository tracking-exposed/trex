import { processLeaf } from './leaf';
import { nature } from './nature';
import searches from './searches';
import thumbnail from './thumbnail';
// import uxlang from './uxlang';

/**
 * export all parsers as dictionary
 */

export const parsers = {
  nature,
  search: searches,
  thumbnail,
};

export type Parsers = typeof parsers;

export const leafParsers = {
  nature: processLeaf,
};

export type LeafParsers = typeof leafParsers;
