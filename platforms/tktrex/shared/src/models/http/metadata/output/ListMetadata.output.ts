import * as t from 'io-ts';
import * as TKMetadata from '../../../metadata';

/**
 * The codec for the the Output of GET /v2/metadata endpoint
 */
export const ListMetadataOutput = t.strict(
  {
    totals: t.strict({
      native: t.number,
      search: t.number,
      foryou: t.number,
      profile: t.number,
      following: t.number,
    }),
    data: t.array(TKMetadata.TKMetadata),
  },
  'ListMetadataOutput',
);

export type ListMetadataOutput = t.TypeOf<typeof ListMetadataOutput>;
