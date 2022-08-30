import {
  BuildMetadataFn,
  LastContributions,
  ParserProviderContextDB,
} from '@shared/providers/parser.provider';
import { sanitizeHTML } from '@shared/utils/html.utils';
import { Ad } from '@yttrex/shared/models/Ad';
import { Leaf } from '@yttrex/shared/models/Leaf';
import * as t from 'io-ts';
import { JSDOM } from 'jsdom';
import _ from 'lodash';
import nconf from 'nconf';
import { LeafParsers } from 'parsers';
import { Supporter } from '../../models/Supporter';

export const LeafSource = t.type(
  {
    html: Leaf,
    jsdom: t.any,
    supporter: Supporter,
  },
  'LeafSource'
);

export type LeafSource = t.TypeOf<typeof LeafSource>;

/*
 * A function to retrieve htmls by filter and amount
 */
export const getLastLeaves =
  (db: ParserProviderContextDB) =>
  async (
    filter: any,
    skip: number,
    amount: number
  ): Promise<LastContributions<LeafSource>> => {
    const leaves = await db.api.aggregate(db.read, nconf.get('schema').leaves, [
      { $match: filter },
      { $sort: { savingTime: 1 } },
      { $limit: amount },
      { $skip: skip },
      {
        $lookup: {
          from: 'supporters',
          localField: 'publicKey',
          foreignField: 'publicKey',
          as: 'supporter',
        },
      },
    ]);

    let errors = 0;

    const formatted = leaves.map(({ supporter, ...h }) => {
      try {
        return {
          supporter: _.first(supporter),
          jsdom: new JSDOM(sanitizeHTML(h.html)).window.document,
          html: h,
        };
      } catch (error) {
        errors++;
        // eslint-disable-next-line
        console.error(
          'Error when formatting HTML: %s, htmlId %s',
          error.message,
          h.id
        );
      }
      return undefined;
    });

    return {
      overflow: _.size(leaves) === amount,
      sources: formatted as any,
      errors,
    };
  };

export const toMetadata: BuildMetadataFn<LeafSource, Ad, LeafParsers> = (
  entry
) => {
  // this contains the original .source (html, impression, timeline), the .findings and .failures
  // the metadata is aggregated by unit and not unrolled in any way
  if (!entry?.findings?.nature) {
    return null;
  }

  let metadata: any = {};
  metadata.savingTime = new Date(entry.source.html.savingTime);
  metadata.id = entry.source.html.metadataId;
  metadata.publicKey = entry.source.html.publicKey;

  metadata = {
    ...entry.source.html,
    ...entry.findings.nature.nature,
    nature: entry.findings.nature,
    href: entry.source.html.href,
    ...metadata,
  };

  return metadata;
};

export const updateAdvertisingAndMetadata =
  (db: ParserProviderContextDB) =>
  async (
    source: LeafSource,
    metadata: Ad
  ): Promise<{
    metadata: Ad;
    source: LeafSource;
    count: { ads: number; leaves: number };
  }> => {
    const result = await db.api.upsertOne(
      db.write,
      nconf.get('schema').ads,
      { id: source.html.id },
      metadata
    );

    // mark all related leaves as "processed"
    const leafResult = await db.api.updateOne(
      db.write,
      nconf.get('schema').leaves,
      { id: source.html.id },
      { processed: true }
    );

    return {
      metadata,
      source,
      count: { ads: result.upsertedCount, leaves: leafResult.modifiedCount },
    };
  };
