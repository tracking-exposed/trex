import { JSDOM } from 'jsdom';
import _ from 'lodash';
import nconf from 'nconf';
import { HTML } from '../../models/HTML';
import { Metadata } from '@yttrex/shared/models/Metadata';
import { Supporter } from '../../models/Supporter';
import {
  LastContributions,
  ParserProviderContext,
  PipelineResults,
} from './types';

export interface HTMLSource {
  html: HTML;
  jsdom: Document;
  supporter: Supporter;
}

export const getLastHTMLs =
  ({ db }: Pick<ParserProviderContext<HTML>, 'db'>) =>
  async (
    filter: any,
    skip: number,
    amount: number
  ): Promise<LastContributions<HTMLSource>> => {
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
          jsdom: new JSDOM(h.html.replace(/\n +/g, '')).window.document,
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

export function toMetadata(
  entry: PipelineResults<HTMLSource> | null
): Metadata | null {
  // this contains the original .source (html, impression, timeline), the .findings and .failures
  // the metadata is aggregated by unit and not unrolled in any way
  if (!entry?.findings?.nature) return null;

  let metadata: any = {};
  metadata.savingTime = new Date(entry.source.html.savingTime);
  metadata.id = entry.source.html.metadataId;
  metadata.publicKey = entry.source.html.publicKey;
  metadata.timelineId = entry.source.html.timelineId;

  if (entry.findings.nature.type === 'search') {
    metadata = {
      ...entry.findings.nature,
      ...entry.findings.downloader,
      ...entry.findings.search,
      ...metadata,
    };

    return metadata;
  }

  /* else ... */
  metadata = {
    ...entry.findings.nature,
    ...entry.findings.description,
    ...entry.findings.music,
    ...entry.findings.hashtags,
    ...entry.findings.numbers,
    ...entry.findings.stitch,
    ...entry.findings.author,
    ...entry.findings.downloader,
    href: entry.source.html.href,
    ...metadata,
  };

  if (Array.isArray(entry.source.html.n)) {
    metadata.order = entry.source.html.n[0];
  }
  // from routes/events.js the 0 is videoCounter, client side
  return metadata;
}

export const updateMetadataAndMarkHTML =
  ({ db }: Pick<ParserProviderContext<HTMLSource>, 'db'>) =>
  async (
    e: PipelineResults<HTMLSource> | null
  ): Promise<{
    metadata: Metadata;
    count: { metadata: number; htmls: number };
  } | null> => {
    // parserLog.debug('Update metadata %O', e);

    if (!e) return null;

    const metadata = toMetadata(e);

    if (!metadata) return null;

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
      { id: e.source.html.id },
      { processed: true }
    );
    // parserLog.debug('Upsert html by %O: %O', { id: e.id }, u);
    return {
      metadata,
      count: { metadata: r.modifiedCount, htmls: u.modifiedCount },
    };
  };
