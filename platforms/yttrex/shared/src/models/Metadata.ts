import * as t from 'io-ts';
import { DateFromISOString } from 'io-ts-types/lib/DateFromISOString';
import { HomeType, SearchType, VideoType } from './Ad';

export const ParsedInfo = t.intersection(
  [
    t.strict(
      {
        index: t.number,
        label: t.union([t.string, t.null]),
        recommendedSource: t.union([t.string, t.null]),
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
        recommendedTitle: t.string,
        recommendedLength: t.number,
        recommendedDisplayL: t.union([t.string, t.null]),
        // moment duration as string
        recommendedPubTime: t.union([t.any, t.null]),
        // recommendedRelativeSeconds: t.union([t.number, t.null]),
        publicationTime: t.union([DateFromISOString, t.null]),
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
    supporter: t.string,
    savingTime: t.string,
    clientTime: t.union([t.string, t.undefined]),
    href: t.string,
    blang: t.union([t.string, t.null]),
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
    publicationTime: t.union([DateFromISOString, t.null]),
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

export const HomeMetadata = t.strict(
  {
    ...MetadataBase.type.props,
    type: HomeType,
    selected: t.array(ParsedInfo),
    sections: t.array(
      t.type({
        i: t.number,
        offset: t.number,
      })
    ),
    login: t.union([t.boolean, t.null]),
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
  'Metadata'
);

export type Metadata = t.TypeOf<typeof Metadata>;

export const MetadataList = t.array(Metadata, 'Metadata[]');
export type MetadataList = t.TypeOf<typeof MetadataList>;
