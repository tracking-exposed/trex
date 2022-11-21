import { MongoClient } from 'mongodb';
import { APIRequestEventDB } from '../../models/APIRequest';
import * as mongo3 from '@shared/providers/mongo.provider';
import nconf from 'nconf';

interface ListAndCountArgs {
  filter: any;
  sort: any;
  skip: number;
  amount: number;
}

interface APIEventsEntity {
  listAndCount: (
    args: ListAndCountArgs
  ) => Promise<{ total: number; data: APIRequestEventDB[] }>;
}

export const GetEventsEntity = (mongoc: MongoClient): APIEventsEntity => {
  const collection = nconf.get('schema').apiRequests;

  return {
    listAndCount: async ({ amount, skip, sort, filter }) => {
      const data = await mongo3.readLimit(
        mongoc,
        collection,
        {
          ...filter,
        },
        sort,
        amount,
        skip
      );
      const total = await mongo3.count(mongoc, collection, filter);
      return { total, data };
    },
  };
};
