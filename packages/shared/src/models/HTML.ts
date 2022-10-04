import * as t from 'io-ts';
import { UUID } from 'io-ts-types/lib/UUID';
import { date } from 'io-ts-types/lib/date';

export const HTML = t.intersection(
  [
    t.strict({
      id: UUID,
      metadataId: t.string,
      blang: t.string,
      href: t.string,
      publicKey: t.string,
      clientTime: date,
      savingTime: date,
      html: t.string,
      counters: t.array(t.number),
      n: t.union([t.array(t.any), t.undefined]),
    }),
    t.partial({
      processed: t.boolean,
      researchTag: t.string,
      experimentId: t.string,
    }),
  ],
  'HTML'
);

export type HTML = t.TypeOf<typeof HTML>;
