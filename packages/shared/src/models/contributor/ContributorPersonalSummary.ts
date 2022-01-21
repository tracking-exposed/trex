import * as t from 'io-ts';

export const SummaryHTMLMetadata = t.strict(
  {
    id: t.string,
    timelineId: t.string,
    href: t.string,
    savingTime: t.string,
  },
  'HTMLMetadata'
);

export type SummaryHTMLMetadata = t.TypeOf<typeof SummaryHTMLMetadata>;

export const SummaryMetadata = t.type(
  {
    id: t.string,
    author: t.union([
      t.type(
        {
          link: t.string,
          name: t.string,
          username: t.string,
        },
        'Author'
      ),
      t.undefined,
    ]),
    baretext: t.union([t.string, t.undefined]),
    description: t.union([t.string, t.undefined]),
    hashtags: t.union([t.array(t.string, 'Hashtags'), t.undefined]),
    metrics: t.union([
      t.type(
        {
          liken: t.string,
          commentsn: t.union([t.string, t.undefined]),
          sharen: t.string,
        },
        'Metrics'
      ),
      t.undefined,
    ]),
    music: t.union([
      t.type(
        {
          url: t.string,
          name: t.string,
        },
        'Music'
      ),
      t.undefined,
    ]),
    order: t.number,
    savingTime: t.string,
    stitch: t.union([
      t.type(
        {
          name: t.string,
          user: t.string,
        },
        'Stitch'
      ),
      t.undefined,
    ]),
    timelineId: t.string,
    type: t.union(
      [t.literal('foryou'), t.literal('home'), t.literal('following')],
      'MetadataType'
    ),
    relative: t.string,
  },
  'Metadata'
);

export type SummaryMetadata = t.TypeOf<typeof SummaryMetadata>;

export const ContributorPersonalSummary = t.strict(
  {
    // supporter: t.strict({
    //   _id: t.string,
    //   publicKey: t.string,
    //   creationTime: t.string,
    //   p: t.string,
    //   lastActivity: t.string,
    //   version: t.string,
    //   tag: t.strict({
    //     id: t.string,
    //     name: t.string,
    //     accessibility: t.string,
    //     lastAccess: t.string,
    //     description: t.string,
    //     // _id: t.string
    //   }),
    //   hereSince: t.string,
    // }),
    htmls: t.array(SummaryHTMLMetadata),
    metadata: t.array(SummaryMetadata),
    counters: t.strict({
      metadata: t.number,
      full: t.number,
      htmlavail: t.number,
    }),
    // request: t.strict({
    //   amount: t.number,
    //   skip: t.number,
    //   when: t.string,
    // }),
  },
  'ContributorPersonalSummary'
);

export type ContributorPersonalSummary = t.TypeOf<
  typeof ContributorPersonalSummary
>;

export const TikTokPSearchMetadata = t.strict(
  {
    id: t.string,
    rejected: t.boolean,
    query: t.string,
    savingTime: t.string,
    results: t.number,
    sources: t.array(t.string)
  },
  'PSearchMetadata'
);

export type TikTokPSearchMetadata = t.TypeOf<typeof TikTokPSearchMetadata>;

export const ContributorPersonalSearch = t.strict(
  {
    metadata: t.array(TikTokPSearchMetadata),
    counters: t.strict({
      metadata: t.number,
    }),
  },
  'ContributorPersonalSearch'
);

export type ContributorPersonalSearch = t.TypeOf<
  typeof ContributorPersonalSearch
>;