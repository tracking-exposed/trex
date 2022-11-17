import { Format } from '@shared/models/common';
import * as t from 'io-ts';
import { BooleanFromString } from 'io-ts-types/lib/BooleanFromString';
import { NumberFromString } from 'io-ts-types/lib/NumberFromString';
import * as Nature from '../../../Nature';

export const ListVideoMetadataQuery = t.type(
  {
    nature: Nature.VideoNatureType,
    title: t.union([t.string, t.undefined]),
    authorName: t.union([t.string, t.undefined]),
  },
  'ListVideoMetadataQuery'
);

export const ListSearchMetadataQuery = t.type(
  {
    nature: Nature.SearchNatureType,
    query: t.union([t.string, t.undefined]),
  },
  'ListSearchMetadataQuery'
);

export const ListHomeMetadataQuery = t.type(
  {
    nature: Nature.HomeNatureType,
    login: t.union([BooleanFromString, t.undefined], 'login?'),
  },
  'ListHomeMetadataQuery'
);

export const ListMetadataQuery = t.partial(
  {
    publicKey: t.union([t.string, t.undefined], 'publicKey?'),
    experimentId: t.union([t.string, t.undefined], 'experimentId?'),
    researchTag: t.union([t.string, t.undefined], 'researchTag?'),
    amount: t.union([NumberFromString, t.number, t.undefined], 'amount?'),
    skip: t.union([NumberFromString, t.number, t.undefined], 'skip?'),
    format: t.union([Format, t.undefined], 'format?'),
    filter: t.union(
      [
        ListVideoMetadataQuery,
        ListSearchMetadataQuery,
        ListHomeMetadataQuery,
        t.undefined,
      ],
      'queryFilter?'
    ),
  },
  'ListMetadataQuery'
);

export type ListMetadataQuery = t.TypeOf<typeof ListMetadataQuery>;
