import { decodeOrThrowRequest } from '@shared/endpoints/helper';
import * as mongo from '@shared/providers/mongo.provider';
import { validateArrayByCodec } from '@shared/utils/fp.utils';
import * as endpoints from '@tktrex/shared/endpoints/v2';
import D from 'debug';
import { toAPIRequest } from '../io/apiRequest.io';
import nconf from 'nconf';

const debug = D('routes:events');

async function getAPIRequests(req: Express.Request): Promise<{ json: any }> {
  const { query } = decodeOrThrowRequest(
    endpoints.default.Public.GETAPIEvents,
    req
  );

  debug('List api requests with query %O', query);
  const { amount, skip, sort, experimentId, publicKey, researchTag } = query;

  const filter: any = {};
  const mongoc = await mongo.clientConnect({});

  if (publicKey) {
    filter.publicKey = {
      $eq: publicKey,
    };
  }

  if (experimentId) {
    filter.experimentId = {
      $eq: experimentId,
    };
  }

  if (researchTag) {
    filter.researchTag = {
      $eq: researchTag,
    };
  }

  // const supporter = await automo.tofu(query.publicKey, )

  const { total, data } = await mongo.listAndCount(
    mongoc,
    nconf.get('schema').apiRequests,
    {
      amount: amount ?? 20,
      skip: skip ?? 0,
      filter,
      sort,
    }
  );

  const validData = validateArrayByCodec(data, toAPIRequest);

  await mongoc.close();

  return {
    json: { total, data: validData },
  };
}

export { getAPIRequests };
