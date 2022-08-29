import * as E from 'fp-ts/lib/Either';
import * as fs from 'fs';
import * as t from 'io-ts';
import { PathReporter } from 'io-ts/lib/PathReporter';
import * as path from 'path';
import { Logger } from '../../logger';
import {
  parseContributions, ParserFn, ParserProviderContext
} from '../../providers/parser.provider';

/**
 * Read the parsed metadata history from '../fixtures/${nature}'
 */
export const readHistoryResults = (
  fixtureDir: string,
  publicKey: string
): any[] => {
  return fs
    .readdirSync(fixtureDir, 'utf-8')
    .filter((file) => file.includes('.json'))
    .map((file) => {
      const filePath = path.resolve(fixtureDir, file);
      // eslint-disable-next-line
      console.log('reading content from ', filePath);
      const content = fs.readFileSync(filePath, 'utf-8');
      const contentJSON = JSON.parse(content);
      return contentJSON;
    })
    .map((mt) => ({
      ...mt,
      sources: mt.sources.map((h: any) => ({
        ...h,
        publicKey,
      })),
      metadata: { ...mt.metadata, publicKey },
    }));
};

// type MetadataResult<T, S> = T & { sources: S[]; _id: string };

export const runParserTest =
  <
    S extends t.Mixed,
    M extends t.Mixed,
    PP extends Record<string, ParserFn<t.TypeOf<S>, any>>
  >({
    codecs,
    expectMetadata,
    expectSources,
    sourceSchema,
    metadataSchema,
    ...opts
  }: {
    log: Logger;
    parsers: PP;
    sourceSchema: string;
    metadataSchema: string;
    expectMetadata: (
      received: Array<t.TypeOf<M> & { _id: string }>,
      expected: Array<t.TypeOf<M> & { _id: string }>
    ) => void;
    expectSources: (s: Array<t.TypeOf<S>>) => void;
  } & ParserProviderContext<S, M, PP>) =>
  async ({ sources, metadata }: any) => {
    opts.log.debug('Sources %d', sources.length);

    // insert the sources in the db
    await opts.db.api.insertMany(
      opts.db.write,
      sourceSchema,
      sources.map((s: any) => s.html)
    );

    const result = await parseContributions<S, M, PP>({ codecs, ...opts })({
      overflow: false,
      errors: 0,
      sources,
    });

    opts.log.debug('Result length %d', result.length);

    // check data in db has changed
    const updatedSources = await opts.db.api.aggregate(
      opts.db.read,
      sourceSchema,
      [
        { $match: { id: { $in: sources.map((h: any) => h.id) } } },
        { $sort: { clientTime: -1 } },
      ]
    );

    expectSources(updatedSources);

    // check stored metadata from db
    const metadataIds = result
      .map((m) => m.metadata)
      .filter((m) => m !== null && m !== undefined)
      .map((m: any) => m.id);

    opts.log.debug('metadata ids count %d', metadataIds.length);
    const metadataResults = await opts.db.api.aggregate(
      opts.db.read,
      metadataSchema,
      [
        {
          $match: {
            id: {
              $in: metadataIds,
            },
          },
        },
      ]
    );

    // ensure metadata returned has the same length as input ids
    expect(metadataResults.length).toBe(1);

    // test metadata has been saved correctly in DB
    const decodeResult = t.array(codecs.metadata).decode(metadataResults);

    if (decodeResult._tag === 'Left') {
      // eslint-disable-next-line
      throw new Error(PathReporter.report(decodeResult).join('\n'));
    }

    opts.log.debug('metadata %d', metadata.length);

    expect(E.isRight(decodeResult)).toBe(true);

    expectMetadata(metadataResults[0], metadata);
  };
