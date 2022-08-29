import { Supporter } from '@shared/models/Supporter';
import {
  BuildMetadataFn,
  GetContributionsFn,
  ParserProviderContextDB,
} from '@shared/providers/parser.provider';
import { TKMetadata } from '@tktrex/shared/models/Metadata';
import { isValid } from 'date-fns';
import D from 'debug';
import * as t from 'io-ts';
import { JSDOM } from 'jsdom';
import _ from 'lodash';
import nconf from 'nconf';
import { TKParsers } from 'parsers';
import { HTML } from '../models/HTML';

const debug = D('lib:parserchain');

export const HTMLSource = t.type(
  {
    html: HTML,
    jsdom: t.any,
    supporter: Supporter,
  },
  'HTMLSource'
);
export type HTMLSource = t.TypeOf<typeof HTMLSource>;

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

  if (entry.findings.nature.type === 'search') {
    metadata = {
      ...entry.findings.nature,
      ...entry.findings.downloader,
      ...entry.findings.search,
    };
    metadata.query = _.toLower(metadata.query);
  } else if (entry.findings.nature.type === 'profile') {
    metadata = {
      ...entry.findings.nature,
      // ...entry.findings.downloader,
      ...entry.findings.profile,
    };
  } else {
    metadata = {
      ...entry.findings.nature,
      ...entry.findings.description,
      ...entry.findings.music,
      ...entry.findings.hashtags,
      ...entry.findings.numbers,
      ...entry.findings.stitch,
      ...entry.findings.author,
      ...entry.findings.downloader,
      ...entry.findings.native,
    };

    metadata.timelineId = entry.source.html.timelineId;
    metadata.order = entry.source.html.n?.[0];
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
    const htmls = await db.api.aggregate(db.read, nconf.get('schema').htmls, [
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
          jsdom: new JSDOM(h.html.replace(/\n +/g, '')).window.document,
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

export const updateMetadataAndMarkHTML =
  (db: ParserProviderContextDB) =>
  async (
    source: HTMLSource,
    metadata: TKMetadata
  ): Promise<{
    metadata: TKMetadata;
    source: HTMLSource;
    count: { metadata: number; htmls: number };
  }> => {
    const r = await db.api.upsertOne(
      db.write,
      nconf.get('schema').metadata,
      { id: source.html.id },
      metadata
    );
    const u = await db.api.updateOne(
      db.write,
      nconf.get('schema').htmls,
      { id: metadata.id },
      { processed: true }
    );

    return {
      metadata,
      source,
      count: { metadata: r.upsertedCount, htmls: u.modifiedCount },
    };
  };
