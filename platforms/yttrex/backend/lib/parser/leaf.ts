import {
  BuildMetadataFn,
  ContributionAndDOMFn,
  GetMetadataFn,
  LastContributions,
  ParserProviderContextDB,
  SaveResults,
} from '@shared/providers/parser';
import { sanitizeHTML } from '@shared/utils/html.utils';
import { Ad } from '@yttrex/shared/models/Ad';
import { LeafParsers } from '@yttrex/shared/parser/parsers';
import { LeafSource } from '@yttrex/shared/parser/source';
import { parseHTML } from 'linkedom';
import _ from 'lodash';
import nconf from 'nconf';

export const getSourceSchema = (): string => nconf.get('schema').leaves;
export const getMetadataSchema = (): string => nconf.get('schema').ads;

export const getMetadata =
  (db: ParserProviderContextDB): GetMetadataFn<LeafSource, Ad> =>
  (e) => {
    return db.api.readOne(
      db.read,
      getMetadataSchema(),
      {
        id: e.html.metadataId,
      },
      {}
    );
  };

export const addDom: ContributionAndDOMFn<LeafSource> = (e) => ({
  ...e,
  jsdom: parseHTML(sanitizeHTML(e.html.html)).window.document,
});

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
    const leaves = await db.api.aggregate(db.read, getSourceSchema(), [
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
          jsdom: parseHTML(sanitizeHTML(h.html)).window.document,
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
  (db: ParserProviderContextDB): SaveResults<LeafSource, Ad> =>
  async (
    source,
    metadata
  ): Promise<{
    metadata: Ad;
    source: LeafSource;
    count: { ads: number; leaves: number };
  }> => {
    const result = await db.api.upsertOne(
      db.write,
      getMetadataSchema(),
      { id: metadata.id },
      metadata
    );

    // mark all related leaves as "processed"
    const leafResult = await db.api.updateOne(
      db.write,
      getSourceSchema(),
      { id: source.html.id },
      { processed: true }
    );

    return {
      metadata,
      source,
      count: { ads: result.upsertedCount, leaves: leafResult.modifiedCount },
    };
  };
