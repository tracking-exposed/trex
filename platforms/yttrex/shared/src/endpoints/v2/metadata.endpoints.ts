import { Format } from '@shared/models/common';
import * as t from 'io-ts';
import { NumberFromString } from 'io-ts-types';
import { Endpoint } from 'ts-endpoint';
import { MetadataList } from '../../models/Metadata';

const ListMetadata = Endpoint({
  Method: 'GET',
  getPath: () => `/v2/metadata`,
  Input: {
    Query: t.type({
      experimentId: t.union([t.string, t.undefined]),
      researchTag: t.union([t.string, t.undefined]),
      amount: t.union([NumberFromString, t.undefined]),
      skip: t.union([NumberFromString, t.undefined]),
      format: t.union([Format, t.undefined]),
    }),
  },
  Output: MetadataList,
});

export default {
  ListMetadata,
};
