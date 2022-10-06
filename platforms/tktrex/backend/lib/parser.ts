import {
  ContributionAndDOMFn,
  GetContributionsFn,
  GetMetadataFn,
  ParserProviderContextDB,
  SaveResults,
} from '@shared/providers/parser.provider';
import { sanitizeHTML } from '@shared/utils/html.utils';
import { TKMetadata } from '@tktrex/shared/models/Metadata';
import { TKParserConfig } from '@tktrex/shared/parser/config';
import { HTMLSource } from '@tktrex/shared/parser/source';
import D from 'debug';
import { JSDOM } from 'jsdom';
import _ from 'lodash';
import nconf from 'nconf';

const debug = D('lib:parserchain');

/**
 * Get metadata collection
 *
 * @returns metadata collection name
 */
export const getMetadataSchema = (): string => nconf.get('schema').metadata;
/**
 * Get source collection
 *
 * @returns source collection name
 */
export const getSourceSchema = (): string => nconf.get('schema').htmls;

export const parserConfig: TKParserConfig = {
  downloads: nconf.get('downloads'),
};

export const addDom: ContributionAndDOMFn<HTMLSource> = (e) => ({
  ...e,
  jsdom: new JSDOM(sanitizeHTML(e.html.html)).window.document,
});

export const getLastHTMLs =
  (db: ParserProviderContextDB): GetContributionsFn<HTMLSource> =>
  async (filter, skip, amount) => {
    const htmls = await db.api.aggregate(db.read, getSourceSchema(), [
      { $match: filter },
      { $sort: { savingTime: 1 } },
      { $skip: skip },
      { $limit: amount },
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
    const formatted = _.map(htmls, function (h) {
      try {
        return {
          supporter: _.first(h.supporter),
          html: _.omit(h, ['supporter']),
        };
      } catch (error: any) {
        errors++;
        debug('Error when formatting HTML: %s, htmlId %s', error.message, h.id);
      }
    });

    return {
      overflow: _.size(htmls) === amount,
      sources: _.compact(formatted) as any,
      errors,
    };
  };

export const getMetadata =
  (ctx: ParserProviderContextDB): GetMetadataFn<HTMLSource, Metadata> =>
  (e) => {
    return ctx.api.readOne(
      ctx.read,
      getMetadataSchema(),
      { id: e.html.metadataId },
      {}
    );
  };

export const updateMetadataAndMarkHTML =
  (db: ParserProviderContextDB): SaveResults<HTMLSource, TKMetadata> =>
  async (source, metadata) => {
    const r = await db.api.upsertOne(
      db.write,
      getMetadataSchema(),
      { id: metadata.id },
      metadata
    );
    const u = await db.api.updateOne(
      db.write,
      getSourceSchema(),
      { id: metadata.id },
      { processed: true }
    );

    return {
      metadata,
      source,
      count: { metadata: r.upsertedCount, htmls: u.modifiedCount },
    };
  };
