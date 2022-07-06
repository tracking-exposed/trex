import * as t from 'io-ts';

const ContributionBaseEvent = t.strict(
  {
    randomUUID: t.string,
    incremental: t.number,
    clientTime: t.string,
    href: t.string,
    researchTag: t.union([t.string, t.undefined]),
    experimentId: t.union([t.string, t.undefined]),
  },
  'ContributionBaseEvent'
);

export const VideoContributionEvent = t.strict(
  {
    ...ContributionBaseEvent.type.props,
    type: t.union([t.literal('video'), t.literal('NewVideo')]),
    element: t.string,
    size: t.number,
  },
  'VideoContributionEvent'
);

export type VideoContributionEvent = t.TypeOf<typeof VideoContributionEvent>;

export const ADVContributionEvent = t.strict(
  {
    ...ContributionBaseEvent.type.props,
    type: t.literal('leaf'),
    html: t.string,
    hash: t.number,
    offsetTop: t.number,
    offsetLeft: t.number,
    selectorName: t.string,
  },
  'ADVContributionEvent'
);

export type ADVContributionEvent = t.TypeOf<typeof ADVContributionEvent>;

export const ContributionEvent = t.union(
  [VideoContributionEvent, ADVContributionEvent],
  'ContributionEvent'
);

export type ContributionEvent = t.TypeOf<typeof ContributionEvent>;

export const AddEventsBody = t.array(ContributionEvent, 'AddEventsBody');

export type AddEventsBody = t.TypeOf<typeof AddEventsBody>;
