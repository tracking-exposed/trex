import { Logger } from '@shared/logger';
import * as E from 'fp-ts/lib/Either';
import * as fs from 'fs';
import * as t from 'io-ts';
import { failure } from 'io-ts/lib/PathReporter';
import * as path from 'path';
import { parseContributions } from '../../../lib/parser/parser';
import { ParserFn, ParserProviderContext } from '../../../lib/parser/types';
import { HTML } from '../../../models/HTML';

/**
 * Read the parsed metadata history from '../fixtures/${nature}'
 */
export const readHistoryResults = (parserName: string, publicKey: string) => {
  return fs
    .readdirSync(path.resolve(__dirname, '../../fixtures', parserName), 'utf-8')
    .filter((file) => file.includes('.json'))
    .map((dir) => {
      const content = fs.readFileSync(
        path.resolve(__dirname, '../../fixtures', parserName, dir),
        'utf-8'
      );
      return JSON.parse(content);
    })
    .map((mt) => ({
      ...mt,
      sources: mt.sources.map((h: any) => ({
        ...h,
        // metadataId: null,
        publicKey,
      })),
      metadata: {
        ...mt.metadata,
        publicKey,
      },
    }));
};

type MetadataResult<T, S> = T & { sources: S[]; _id: string };

export const runParserTest =
  <S, T extends t.Mixed>({
    codec,
    mapSource,
    expectMetadata,
    expectSources,
    sourceSchema,
    ...opts
  }: {
    log: Logger;
    parsers: Record<string, ParserFn<S>>;
    mapSource: (s: S) => any;
    sourceSchema: string;
    codec: T;
    expectMetadata: (
      received: t.TypeOf<T> & { _id: string },
      expected: t.TypeOf<T> & { _id: string }
    ) => void;
    expectSources: (s: S[]) => void;
  } & ParserProviderContext<S>) =>
  async ({ sources, metadata }: any) => {
    // insert the sources in the db
    await opts.db.api.insertMany(opts.db.write, sourceSchema, sources);

    const result = await parseContributions<S>(opts)({
      overflow: false,
      errors: 0,
      sources: sources.map(mapSource),
    });
    // appTest.debug('Result %O', result);

    // check data in db has changed
    const updatedSources = await opts.db.api.aggregate(
      opts.db.read,
      sourceSchema,
      [
        { $match: { id: { $in: sources.map((h: HTML) => h.id) } } },
        { $sort: { clientTime: -1 } },
      ]
    );

    expectSources(updatedSources);

    expect(result?.metadata[0]).toBeTruthy();

    result?.metadata.forEach((m) => {
      const decodeResult = codec.decode(m);

      if (decodeResult._tag === 'Left') {
        console.log(failure(decodeResult.left));
      }

      expect(E.isRight(decodeResult)).toBe(true);

      expectMetadata(m as any, metadata);
    });
  };
