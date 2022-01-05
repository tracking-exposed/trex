import * as t from 'io-ts';
import { date } from 'io-ts-types/lib/date';

export const Metadata = t.strict(
  {
    // experiments etc
    id: t.string,
    publicKey: t.string,
    savingTime: date,
    clientTime: date,
    href: t.string,
    params: t.record(t.string, t.string),
    blang: t.string,
    login: t.boolean,
    metadataId: t.string,
  },
  'Metadata'
);
export type Metadata = t.TypeOf<typeof Metadata>;

export const GuardoniExperiment = t.strict(
  {
    experimentId: t.string,
    when: date,
    humanizedWhen: t.string,
    links: t.array(
      t.type({
        urltag: t.string,
        watchFor: t.number,
        url: t.string,
      })
    ),
  },
  'GuardoniExperiment'
);
export type GuardoniExperiment = t.TypeOf<typeof GuardoniExperiment>;
