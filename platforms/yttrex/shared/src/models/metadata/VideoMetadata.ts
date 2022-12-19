import * as t from 'io-ts';
import { date } from 'io-ts-types/lib/date';
import { VideoN } from '../Nature';
import { YTMetadataBase } from './MetadataBase';
import { ParsedInfo } from './VideoResult';
import { DateFromISOString } from 'io-ts-types/lib/DateFromISOString';

export const VideoMetadata = t.strict(
  {
    ...YTMetadataBase.type.props,
    ...VideoN.type.props,
    params: t.record(t.string, t.string),
    login: t.union([t.boolean, t.null]),
    authorName: t.string,
    authorSource: t.string,
    title: t.string,
    publicationString: t.string,
    publicationTime: t.union([DateFromISOString, date, t.null]),
    likeInfo: t.strict(
      {
        watchedLikes: t.union([t.number, t.null]),
        watchedDislikes: t.union([t.number, t.null]),
      },
      'LikeInfo'
    ),
    viewInfo: t.strict(
      {
        viewStr: t.string,
        viewNumber: t.number,
      },
      'ViewInfo'
    ),
    forKids: t.boolean,
    related: t.array(ParsedInfo),
  },
  'VideoMetadata'
);

export type VideoMetadata = t.TypeOf<typeof VideoMetadata>;
