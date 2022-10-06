import { processLeaf } from './leaf';
import nature from './nature';
import thumbnail from './thumbnail';

/**
 * export all parsers as dictionary
 */

export const parsers = {
  nature,
  thumbnail,
};

export type Parsers = typeof parsers;

export const leafParsers = {
  nature: processLeaf,
};

export type LeafParsers = typeof leafParsers;
