import nature from './parsers/nature';
import description from './parsers/description';
import music from './parsers/music';
import hashtags from './parsers/hashtags';
import metrics from './parsers/metrics';
import stitch from './parsers/stitch';
import author from './parsers/author';
import search from './parsers/search';
import profile from './parsers/profile';
import native from './parsers/native';
import downloader from './parsers/downloader';

export const parsers = {
  nature,
  description,
  music,
  hashtags,
  metrics,
  stitch,
  author,
  search,
  profile,
  native,
  downloader,
};

export type TKParsers = typeof parsers;
