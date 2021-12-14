import * as t from "io-ts";

export const ChannelRelated = t.strict(
  {
    channelId: t.string,
    recommendedChannelCount: t.number,
    percentage: t.number,
  },
  "ChannelRelated"
);

export type ChannelRelated = t.TypeOf<typeof ChannelRelated>;

export const GetRelatedChannelsOutput = t.strict(
  {
    content: t.array(ChannelRelated),
    channelId: t.string,
    authorName: t.string,
    totalMetadata: t.number,
    score: t.number,
    totalRecommendations: t.number,
    pagination: t.strict({
      amount: t.number,
    }),
    overflow: t.boolean,
  },
  "GetRelatedChannelsOutput"
);

export type GetRelatedChannelsOutput = t.TypeOf<
  typeof GetRelatedChannelsOutput
>;
