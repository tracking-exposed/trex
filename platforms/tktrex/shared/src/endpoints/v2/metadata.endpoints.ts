import { DocumentedEndpoint } from '@shared/endpoints';
import { Format } from '@shared/models/common';
import * as t from 'io-ts';
import { NumberFromString } from 'io-ts-types/NumberFromString';
import * as apiModel from '../../models';

const ListMetadata = DocumentedEndpoint({
  title: 'Get metadata by research tag',
  description: '',
  tags: ['public'],
  Method: 'GET',
  getPath: () => '/v2/metadata',
  Input: {
    Query: t.type({
      experimentId: t.union([t.string, t.undefined]),
      researchTag: t.union([t.string, t.undefined]),
      amount: t.union([NumberFromString, t.undefined]),
      skip: t.union([NumberFromString, t.undefined]),
      format: t.union([Format, t.undefined]),
    }),
  },
  Output: t.array(apiModel.TKMetadata.TKMetadata),
});

export default {
  ListMetadata,
};
