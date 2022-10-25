import * as t from 'io-ts';
import { DateFromISOString } from 'io-ts-types/lib/DateFromISOString';

export const ParsedInfo = t.strict(
  {
    index: t.number,
    label: t.union([t.string, t.null]),
    elems: t.union([t.number, t.undefined]),
    videoId: t.string,
    timePrecision: t.string,
    thumbnailHref: t.union([t.string, t.null, t.undefined]),
    isLive: t.boolean,
    verified: t.union([t.boolean, t.null]),
    // foryou: t.union([t.string, t.undefined, t.null]),
    parameter: t.union([t.string, t.undefined]),
    params: t.union([t.record(t.string, t.string), t.undefined, t.null]),
    title: t.union([t.string, t.undefined]),
    recommendedHref: t.string,
    recommendedTitle: t.union([t.string, t.undefined]),
    recommendedSource: t.union([t.string, t.null, t.undefined]),
    recommendedLength: t.union([t.number, t.undefined]),
    recommendedDisplayL: t.union([t.string, t.undefined, t.null]),
    // moment duration as string
    recommendedPubTime: t.union([t.any, t.undefined]),
    publicationTime: t.union([DateFromISOString, t.undefined, t.null]),
    recommendedThumbnail: t.union([t.string, t.undefined, t.null]),
    recommendedViews: t.union([t.number, t.undefined]),
    views: t.union([t.number, t.undefined]),
  },
  'ParsedInfo'
);

export type ParsedInfo = t.TypeOf<typeof ParsedInfo>;
