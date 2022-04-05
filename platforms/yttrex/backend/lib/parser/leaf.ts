import _ from 'lodash';
import nconf from 'nconf';
import { Ad } from '../../models/Ad';
import { Leaf } from '../../models/Leaf';
import { ParserProviderContext, PipelineResults } from './types';

/*
 * A function to retrieve htmls by filter and amount
 */
export const getLastLeaves =
  ({ db }: Pick<ParserProviderContext<Leaf>, 'db'>) =>
  async (
    filter: any,
    skip: number,
    amount: number
  ): Promise<{
    overflow: boolean;
    sources: Leaf[];
    errors: number;
  }> => {
    const leaves = await db.api.readLimit(
      db.read,
      nconf.get('schema').leaves,
      filter,
      { savingTime: 1 },
      amount,
      skip
    );

    return {
      overflow: _.size(leaves) === amount,
      sources: leaves,
      errors: 0,
    };
  };

export const updateAdvertisingAndMetadata =
  ({ db }: Pick<ParserProviderContext<Ad>, 'db'>) =>
  async (
    ad: PipelineResults<Ad> | null
  ): Promise<{
    metadata: Ad;
    count: { [key: string]: number };
  } | null> => {
    if (!ad) return null;

    const result = await db.api.upsertOne(
      db.write,
      nconf.get('schema').ads,
      { id: ad.source.id },
      ad
    );

    const leafResult = await db.api.updateOne(
      db.write,
      nconf.get('schema').leaves,
      { id: ad.source.id },
      { processed: true }
    );

    return {
      metadata: ad.source,
      count: { ads: result.modifiedCount, leaves: leafResult.modifiedCount },
    };
  };
