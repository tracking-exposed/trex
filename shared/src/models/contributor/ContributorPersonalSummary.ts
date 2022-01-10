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
    author: t.type(
      {
        link: t.string,
        name: t.string,
        username: t.string,
      },
      'Author'
    ),
    baretext: t.string,
    description: t.string,
    hashtags: t.union([t.array(t.string, 'Hashtags'), t.undefined]),
    metrics: t.type(
      {
        liken: t.string,
        commentsn: t.union([t.string, t.undefined]),
        sharen: t.string,
      },
      'Metrics'
    ),
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
    type: t.union([t.literal('foryou'), t.literal('home')], 'MetadataType'),
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
