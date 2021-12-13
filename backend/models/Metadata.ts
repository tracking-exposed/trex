import { VideoContributionEvent } from "@shared/models/ContributionEvent";
import * as t from "io-ts";
import { date } from "io-ts-types/lib/date";

const { element, size } = VideoContributionEvent.type.props;
export const Metadata = t.strict(
  {
    ...{ element, size },
    id: t.string,
    publicKey: t.string,
    savingTime: date,
    clientTime: date,
    href: t.string,
    title: t.string,
    type: t.literal('video'),
    params: t.strict({ v: t.string }),
    videoId: t.string,
    login: t.boolean,
    publicationString: t.number,
    publicationTime: date,
    authorName: t.string,
    authorSource: t.string,
    metadataId: t.string,
    related: t.array(t.strict({
      index: t.number,
      verified: t.boolean,
      foryou: t.union([t.string, t.null]),
      videoId: t.string,
      params: t.strict({
        v: t.string
      }),
      recommendedSource: t.string,
      recommendedTitle: t.string,
      recommendedLength: t.number,
      recommendedDisplayL: t.string,
      likeInfo: t.strict({
        likes: t.string,
        dislikes: t.union([t.string, t.null]),
      }),

    })),
    blang: t.string,
  },
  "MetadataDB"
);

export type Metadata = t.TypeOf<typeof Metadata>;
