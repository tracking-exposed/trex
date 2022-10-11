import * as t from 'io-ts';

export const MetadataBase = t.type(
  {
    _id: t.unknown,
    id: t.string,
    /**
     * The href where the evidence has been collected
     */
    href: t.string,
    /**
     * The supporter publicKey
     *
     * TODO: it may be replaced by the supporter id
     */
    publicKey: t.string,
    timelineId: t.string,
    researchTag: t.union([t.string, t.undefined]),
    experimentId: t.union([t.string, t.undefined]),
    /**
     * DB saving time
     */
    clientTime: t.string,
    savingTime: t.string,
  },
  'MetadataBase',
);

export type MetadataBase = t.TypeOf<typeof MetadataBase>;
