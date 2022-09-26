import * as t from 'io-ts';
import { UUID } from 'io-ts-types/lib/UUID';
import { date } from 'io-ts-types/lib/date';
import { Nature } from './Nature';

export const HTML = t.strict(
  {
    nature: Nature,
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
    experimentId: t.union([t.string, t.undefined]),
    researchTag: t.union([t.string, t.undefined]),
  },
  'HTML'
);

export type HTML = t.TypeOf<typeof HTML>;
