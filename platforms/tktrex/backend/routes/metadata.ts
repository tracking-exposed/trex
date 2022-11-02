import { decodeOrThrowRequest } from '@shared/endpoints/helper';
import * as foodUtils from '@shared/utils/food.utils';
import endpoints, {
  ListMetadataResponse,
} from '@tktrex/shared/endpoints/v2/metadata.endpoints';
import createDebug from 'debug';
import _ from 'lodash';
import * as automo from '../lib/automo';

const debug = createDebug('routes:public');

// This variables is used as cap in every readLimit below
const PUBLIC_AMOUNT_ELEMS = 100;

const listMetadata = async (
  req: any
): Promise<{ json: ListMetadataResponse }> => {
  const {
    query: {
      researchTag,
      experimentId,
      publicKey,
      nature,
      amount = PUBLIC_AMOUNT_ELEMS,
      skip = 0,
    },
  } = decodeOrThrowRequest(endpoints.ListMetadata, req);

  const filter = {} as any;
  if (publicKey) {
    filter.publicKey = publicKey;
  }
  if (experimentId) {
    filter.experimentId = experimentId;
  }

  if (researchTag) {
    filter.researchTag = researchTag;
  }

  if (nature) {
    filter['nature.type'] = nature;
  }

  debug('Filtering metadata for %O (%d, %d)', filter, amount, skip);

  const metadata = await automo
    .getMetadataByFilter(filter, {
      amount,
      skip,
    })
    .then(({ totals, data }) => ({
      totals,
      data: data.map(({ publicKey, _id, id, ...m }) => ({
        ...m,
        id: id.substring(0, 10),
        supporter: foodUtils.string2Food(publicKey),
      })),
    }));

  debug('fetched %d evidences', _.size(metadata));

  return { json: metadata };
};

export { listMetadata };
