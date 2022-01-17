import * as t from 'io-ts';

import { DateFromISOString } from 'io-ts-types/lib/DateFromISOString';

export const VisitStep = t.type(
  {
    type: t.literal('visit'),
    url: t.string,
  },
  'VisitStep'
);
export type VisitStep = t.TypeOf<typeof VisitStep>;

export const WaitStep = t.type(
  {
    type: t.literal('wait'),
    duration: t.number,
  },
  'WaitStep'
);
export type WaitStep = t.TypeOf<typeof WaitStep>;

export const SearchStep = t.type({
  type: t.literal('search'),
  query: t.string,
  platform: t.union([
    t.literal('tiktok'),
    t.literal('youtube'),
  ], 'platform'),
  platformURL: t.string,
}, 'SearchStep');
export type SearchStep = t.TypeOf<typeof SearchStep>;

export const AutomationStep = t.union([
  VisitStep,
  WaitStep,
  SearchStep,
], 'AutomationStep');
export type AutomationStep = t.TypeOf<typeof AutomationStep>;

export const AutomationScript = t.array(AutomationStep, 'AutomationScript');
export type AutomationScript = t.TypeOf<typeof AutomationScript>;

export const AutomationScenario = t.type(
  {
    type: t.string,
    description: t.union([t.string, t.undefined]),
    label: t.union([t.string, t.undefined]),
    script: AutomationScript,
    createdAt: DateFromISOString,
  },
  'AutomationScenario'
);

export type AutomationScenario = t.TypeOf<typeof AutomationScenario>;

export default AutomationScript;
