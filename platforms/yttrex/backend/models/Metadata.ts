import * as t from 'io-ts';
import { date } from 'io-ts-types/lib/date';
import { HomeType, SearchType, VideoType } from './Ad';

export const ParsedInfo = t.intersection(
  [
    t.strict(
      {
        index: t.number,
        label: t.union([t.string, t.undefined]),
        elems: t.union([t.number, t.undefined]),
        videoId: t.string,

        timePrecision: t.string,
        thumbnailHref: t.union([t.string, t.null, t.undefined]),
      },
      'Common'
    ),
    t.partial(
      {
        isLive: t.boolean,
        verified: t.union([t.boolean, t.null]),
        foryou: t.union([t.string, t.null]),
        params: t.union([t.record(t.string, t.string), t.null]),
        recommendedSource: t.string,
        recommendedTitle: t.string,
        recommendedLength: t.number,
        recommendedDisplayL: t.string,
        recommendedPubTime: t.union([date, t.null]),
        publicationTime: t.union([date, t.null])
      },
      'Partial'
    ),
  ],
  'ParsedInfo'
);

export type ParsedInfo = t.TypeOf<typeof ParsedInfo>;

const MetadataBase = t.strict(
  {
    id: t.string,
    publicKey: t.string,
    savingTime: date,
    clientTime: t.union([date, t.undefined]),
    href: t.string,
    blang: t.union([t.string, t.undefined])
  },
  'MetadataBase'
);

export const VideoMetadata = t.strict(
  {
    ...MetadataBase.type.props,
    params: t.record(t.string, t.string),
    type: VideoType,
    login: t.union([t.boolean, t.null]),
    videoId: t.string,
    authorName: t.string,
    authorSource: t.string,
    title: t.string,
    publicationString: t.string,
    publicationTime: date,
    likeInfo: t.strict(
      {
        likes: t.union([t.string, t.null]),
        dislikes: t.union([t.string, t.null]),
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

export const HomeMetadata = t.strict(
  {
    ...MetadataBase.type.props,
    type: HomeType,
    selected: t.array(ParsedInfo),
  },
  'HomeMetadata'
);
export type HomeMetadata = t.TypeOf<typeof HomeMetadata>;

export const SearchMetadata = t.strict(
  {
    ...MetadataBase.type.props,
    type: SearchType,
    query: t.string,
    correction: t.union([t.array(t.string), t.undefined]),
    results: t.array(
      t.strict({
        position: t.number,
        title: t.string,
      })
    ),
  },
  'SearchMetadata'
);
export type SearchMetadata = t.TypeOf<typeof SearchMetadata>;

export const Metadata = t.union(
  [VideoMetadata, HomeMetadata, SearchMetadata],
  'MetadataDB'
);

export type Metadata = t.TypeOf<typeof Metadata>;
