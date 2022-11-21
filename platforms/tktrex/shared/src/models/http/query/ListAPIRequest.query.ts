import * as t from 'io-ts';
import { APIRequest } from '../../apiRequest/APIRequest';
import { ListQueryBase } from './ListQueryBase.query';

/**
 * The codec for the Query used for GET /v2/metadata endpoint
 */
export const ListAPIRequestQuery = t.type(
  {
    ...ListQueryBase.props,
    publicKey: t.union([t.string, t.undefined]),
    experimentId: t.union([t.string, t.undefined]),
    researchTag: t.union([t.string, t.undefined]),
    sort: t.union([
      t.record(t.keyof(APIRequest.type.props), t.number),
      t.undefined,
    ]),
    // we want the filter to be specific for
    // the nature given
    // filter: t.union([ListHashtagMetadataQuery, t.undefined]),
  },
  'ListMetadataQuery',
);

export type ListAPIRequestQuery = t.TypeOf<typeof ListAPIRequestQuery>;
