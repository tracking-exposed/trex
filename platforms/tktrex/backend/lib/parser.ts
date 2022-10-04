import {
  BuildMetadataFn,
  ContributionAndDOMFn,
  GetContributionsFn,
  GetMetadataFn,
  ParserProviderContextDB,
  SaveResults,
} from '@shared/providers/parser.provider';
import { sanitizeHTML } from '@shared/utils/html.utils';
import { TKMetadata } from '@tktrex/shared/models/Metadata';
import { TKParsers } from '@tktrex/shared/parser/parsers';
import { TKParserConfig } from '@tktrex/shared/parser/config';
import { HTMLSource } from '@tktrex/shared/parser/source';
import { isValid } from 'date-fns';
import D from 'debug';
import _ from 'lodash';
import nconf from 'nconf';
import { JSDOM } from 'jsdom';

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

export const buildMetadata: BuildMetadataFn<
  HTMLSource,
  TKMetadata,
  TKParsers
> = (entry) => {
  // this contains the original .source (html, impression, timeline), the .findings and .failures
  // the metadata is aggregated by unit and not unrolled in any way
  if (!entry?.findings?.nature) return null;

  let metadata: any = {
    clientTime: entry.source.html.clientTime,
  };

  switch (entry.findings.nature.type) {
    case 'foryou': {
      const {
        nature,
        author,
        description,
        hashtags,
        metrics,
        music,
        downloader,
      } = entry.findings;
      metadata = {
        ...metadata,
        ...nature,
        nature,
        ...description,
        author,
        metrics,
        music,
        hashtags,
        ...downloader,
      };
      break;
    }
    case 'search': {
      const { nature, downloader, search } = entry.findings;
      metadata = {
        ...metadata,
        ...nature,
        nature,
        ...downloader,
        ...search,
      };
      metadata.query = _.toLower(metadata.query);
      metadata.nature.query = metadata.query;
      break;
    }
    case 'profile': {
      const { nature, profile, downloader } = entry.findings;
      metadata = {
        ...metadata,
        nature,
        ...nature,
        ...downloader,
        ...profile,
      };
      break;
    }
    case 'video':
    case 'native': {
      const {
        nature,
        description,
        music,
        hashtags,
        metrics,
        stitch,
        author,
        downloader,
        native,
      } = entry.findings;
      metadata = {
        ...nature,
        nature,
        ...description,
        music,
        hashtags,
        metrics,
        stitch,
        author,
        ...downloader,
        ...native,
      };
      break;
    }
    default: {
      metadata = {
        ...metadata,
        ...entry.findings,
        ...entry.findings.nature,
      };
    }
  }

  /* fixed fields */
  metadata.savingTime = isValid(entry.source.html.savingTime)
    ? entry.source.html.savingTime.toISOString()
    : entry.source.html.savingTime;
  metadata.clientTime = isValid(entry.source.html.clientTime)
    ? entry.source.html.clientTime.toISOString()
    : entry.source.html.clientTime;
  metadata.id = entry.source.html.id;
  metadata.publicKey = entry.source.html.publicKey;
  metadata.timelineId = entry.source.html.timelineId;
  metadata.order = entry.source.html.n?.[0];

  /* optional fields */
  if (entry.source.html.geoip?.length === 2)
    metadata.geoip = entry.source.html.geoip;
  if (entry.source.html.researchTag?.length)
    metadata.researchTag = entry.source.html.researchTag;
  if (entry.source.html.experimentId?.length)
    metadata.experimentId = entry.source.html.experimentId;

  return metadata;
};

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
