import { DocumentedEndpoint } from '@shared/endpoints';
import { Format } from '@shared/models/common';
import * as t from 'io-ts';
import { NumberFromString } from 'io-ts-types/NumberFromString';
import * as apiModel from '../../models';

export const ListMetadataOutput = t.strict(
  {
    totals: t.strict({
      native: t.number,
      search: t.number,
      foryou: t.number,
      profile: t.number,
    }),
    data: t.array(apiModel.TKMetadata.TKMetadata),
  },
  'ListMetadataOutput',
);

export const ListMetadataResponse = t.strict(
  {
    data: t.array(apiModel.TKMetadata.TKMetadata),
    totals: t.record(apiModel.Nature.NatureType, t.number),
  },
  'ListMetadataResponse',
);
export type ListMetadataResponse = t.TypeOf<typeof ListMetadataResponse>;

export const ListMetadataQuery = t.type(
  {
    publicKey: t.union([t.string, t.undefined]),
    nature: t.union([apiModel.Nature.NatureType, t.undefined]),
    experimentId: t.union([t.string, t.undefined]),
    researchTag: t.union([t.string, t.undefined]),
    amount: t.union([NumberFromString, t.number, t.undefined]),
    skip: t.union([NumberFromString, t.number, t.undefined]),
    format: t.union([Format, t.undefined]),
  },
  'ListMetadataQuery',
);

export type ListMetadataQuery = t.TypeOf<typeof ListMetadataQuery>;

const ListMetadata = DocumentedEndpoint({
  title: 'List metadata by given filters',
  description: '',
  tags: ['public', 'metadata'],
  Method: 'GET',
  getPath: () => '/v2/metadata',
  Input: {
    Query: ListMetadataQuery,
  },
  Output: ListMetadataOutput,
});

export default {
  ListMetadata,
};
