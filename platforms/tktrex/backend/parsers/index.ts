import nature from './nature';
import description from './description';
import music from './music';
import hashtags from './hashtags';
import numbers from './numbers';
import stitch from './stitch';
import author from './author';
import search from './search';
import profile from './profile';
import native from './native';
import downloader from './downloader';

export const parsers = {
  nature,
  description,
  music,
  hashtags,
  metrics: numbers,
  stitch,
  author,
  search,
  profile,
  native,
  downloader,
};

export type TKParsers = typeof parsers;
