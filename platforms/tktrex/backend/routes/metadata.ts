import { decodeOrThrowRequest } from '@shared/endpoints/helper';
import endpoints from '@tktrex/shared/endpoints/v2/public.endpoints';
import createDebug from 'debug';
import _ from 'lodash';
import automo from '../lib/automo';

const debug = createDebug('routes:public');

// This variables is used as cap in every readLimit below
const PUBLIC_AMOUNT_ELEMS = 100;

const listMetadata = async (req): Promise<any> => {
  const {
    query: {
      researchTag,
      experimentId,
      amount = PUBLIC_AMOUNT_ELEMS,
      skip = 0,
    },
  } = decodeOrThrowRequest(endpoints.ListMetadata, req);

  const metadata = await automo.getMetadataByFilter(
    {
      researchTag,
      experimentId,
    },
    {
      amount,
      skip,
    }
  );

  debug(
    'Returning metadata by researchTag %s, %d evidences',
    researchTag,
    _.size(metadata)
  );

  return { json: metadata };
};

export { listMetadata };
