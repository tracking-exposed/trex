import * as t from 'io-ts';
import { UUID } from 'io-ts-types/lib/UUID';
import { date } from 'io-ts-types/lib/date';

export const HTMLSource = t.strict(
  {
    id: UUID,
    metadataId: UUID,
    blang: t.string,
    href: t.string,
    publicKey: t.string,
    clientTime: date,
    savingTime: date,
    html: t.string,
    counters: t.array(t.number),
    processed: t.boolean,
    timelineId: t.union([t.string, t.undefined]),
    n: t.union([t.array(t.any), t.undefined]),
    researchTag: t.union([t.string, t.undefined]),
    experimentId: t.union([t.string, t.undefined]),
  },
  'HTMLSource'
);

export type HTMLSource = t.TypeOf<typeof HTMLSource>;
