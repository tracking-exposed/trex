import {
  ContributionAndDOMFn,
  GetContributionsFn,
  GetMetadataFn,
  ParserProviderContextDB,
  SaveResults,
} from '@shared/providers/parser';
import { sanitizeHTML } from '@shared/utils/html.utils';
import { Metadata } from '@yttrex/shared/models/metadata/Metadata';
import { Supporter } from '@yttrex/shared/models/Supporter';
import { HTMLSource } from '@yttrex/shared/parser';
import _ from 'lodash';
import nconf from 'nconf';
import { HTML } from '../../models/HTML';
import { parseHTML } from 'linkedom';
// import { trexLogger } from '@shared/logger';

// const parserLog = trexLogger.extend('parser:html');

export const getSourceSchema = (): string => nconf.get('schema').htmls;
export const getMetadataSchema = (): string => nconf.get('schema').metadata;

export const addDom: ContributionAndDOMFn<HTMLSource> = (e) => ({
  ...e,
  jsdom: parseHTML(sanitizeHTML(e.html.html)).window.document,
});

export const getLastHTMLs =
  (db: ParserProviderContextDB): GetContributionsFn<HTMLSource> =>
  async (filter, skip, amount) => {
    const htmls: Array<
      HTML & {
        supporter: Supporter[];
      }
    > = await db.api.aggregate(db.read, getSourceSchema(), [
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
    const formatted = htmls.map(({ supporter, ...h }) => {
      try {
        return {
          supporter: _.first(supporter),
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
  (db: ParserProviderContextDB): SaveResults<HTMLSource, Metadata> =>
  async (source, metadata) => {
    const { _id, ...m }: any = metadata;
    const r = await db.api.upsertOne(
      db.write,
      getMetadataSchema(),
      { id: source.html.metadataId },
      m
    );

    // console.log('Upsert metadata by %O: %O', r);

    const u = await db.api.updateOne(
      db.write,
      getSourceSchema(),
      { id: source.html.id },
      { processed: true }
    );
    // parserLog.debug('Upsert html by %O: %O', { id: e.id }, u);
    return {
      metadata,
      source,
      count: { metadata: r.modifiedCount, source: u.modifiedCount },
    };
  };
