import {
  BuildMetadataFn,
  GetContributionsFn,
  ParserProviderContextDB,
} from '@shared/providers/parser.provider';
import { sanitizeHTML } from '@shared/utils/html.utils';
import { Metadata } from '@yttrex/shared/models/Metadata';
import { isValid } from 'date-fns';
import * as t from 'io-ts';
import { JSDOM } from 'jsdom';
import _ from 'lodash';
import nconf from 'nconf';
import { HTML } from '../../models/HTML';
import { Supporter } from '../../models/Supporter';
import { Parsers } from '../../parsers';

export const HTMLSource = t.type(
  {
    html: HTML,
    supporter: Supporter,
    jsdom: t.any,
  },
  'HTMLSource'
);

export type HTMLSource = t.TypeOf<typeof HTMLSource>;

export const getLastHTMLs =
  (db: ParserProviderContextDB): GetContributionsFn<HTMLSource> =>
  async (filter, skip, amount) => {
    const htmls: Array<
      HTML & {
        supporter: Supporter[];
      }
    > = await db.api.aggregate(db.read, nconf.get('schema').htmls, [
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
      overflow: _.size(htmls) === amount,
      sources: _.compact(formatted) as any,
      errors,
    };
  };

export const toMetadata: BuildMetadataFn<HTMLSource, Metadata, Parsers> = (
  entry
) => {
  // this contains the original .source (html, impression, timeline), the .findings and .failures
  // the metadata is aggregated by unit and not unrolled in any way
  if (!entry?.findings?.nature) return null;

  let metadata: any = {};
  metadata.savingTime = isValid(entry.source.html.savingTime)
    ? entry.source.html.savingTime
    : new Date(entry.source.html.savingTime);
  metadata.clientTime = isValid(entry.source.html.clientTime)
    ? entry.source.html.clientTime
    : new Date(entry.source.html.clientTime);
  metadata.id = entry.source.html.metadataId;
  metadata.publicKey = entry.source.html.publicKey;
  if (
    entry.source.html.experimentId &&
    entry.source.html.experimentId.length > 0
  ) {
    metadata.experimentId = entry.source.html.experimentId;
  }

  if (
    entry.source.html.researchTag &&
    entry.source.html.researchTag.length > 0
  ) {
    metadata.researchTag = entry.source.html.researchTag;
  }

  if (entry.findings.nature.type === 'search') {
    metadata = {
      ...entry.findings.nature,
      ...entry.findings.search,
      ...metadata,
    };

    return metadata;
  }

  /* else ... */
  metadata = {
    ...entry.findings.nature,
    href: entry.source.html.href,
    ...metadata,
  };

  if (Array.isArray(entry.source.html.n)) {
    metadata.order = entry.source.html.n[0];
  }

  // from routes/events.js the 0 is videoCounter, client side
  return metadata;
};

export const updateMetadataAndMarkHTML =
  (db: ParserProviderContextDB) =>
  async (
    source: HTMLSource,
    metadata: Metadata
  ): Promise<{
    metadata: Metadata;
    source: HTMLSource;
    count: { metadata: number; htmls: number };
  }> => {
    const r = await db.api.upsertOne(
      db.write,
      nconf.get('schema').metadata,
      { id: metadata.id },
      metadata
    );

    // parserLog.debug('Upsert metadata by %O: %O', { id: e.id }, r);

    const u = await db.api.updateOne(
      db.write,
      nconf.get('schema').htmls,
      { id: source.html.id },
      { processed: true }
    );
    // parserLog.debug('Upsert html by %O: %O', { id: e.id }, u);
    return {
      metadata,
      source,
      count: { metadata: r.modifiedCount, htmls: u.modifiedCount },
    };
  };
