import * as E from 'fp-ts/lib/Either';
import * as fs from 'fs';
import * as t from 'io-ts';
import { PathReporter } from 'io-ts/lib/PathReporter';
import path from 'path';
import { Logger } from '../../logger';
import {
  parseContributions,
  ParserConfiguration,
  ParserFn,
  ParserProviderContext,
  printResultOutput,
} from '../../providers/parser.provider';

/**
 * Read fixtures file from path
 *
 * @param fixtureDir
 * @returns string
 */
export const readFixtureJSONPaths = (
  fixtureDir: string,
  opts?: {
    exclude?: string[];
    only?: string[];
  }
): any[] => {
  const paths = fs
    .readdirSync(fixtureDir, 'utf-8')
    .filter((file) => file.includes('.json'))
    .map((fp) => path.resolve(fixtureDir, fp));

  const filteredPaths = opts?.exclude
    ? paths.filter((p) => !(opts.exclude ?? []).some((id) => p.includes(id)))
    : opts?.only
    ? paths.filter((p) => (opts.only ?? []).find((id) => p.includes(id)))
    : paths;

  // eslint-disable-next-line
  console.log(
    'Fixtures from %d (total %d) files',
    filteredPaths.length,
    paths.length
  );

  return filteredPaths;
};

/**
 * Read the parsed metadata history from '../fixtures/${nature}'
 *
 * @param fixtureFilePath
 * @param publicKey Supporter public key
 *
 */
export const readFixtureJSON = (
  fixtureFilePath: string,
  publicKey: string
): { sources: any[]; metadata: any } => {
  const content = fs.readFileSync(fixtureFilePath, 'utf-8');
  const mt = JSON.parse(content);
  return {
    ...mt,
    sources: mt.sources.map((h: any) => ({
      ...h,
      publicKey,
    })),
    metadata: { ...mt.metadata, publicKey },
  };
};

// type MetadataResult<T, S> = T & { sources: S[]; _id: string };

export const runParserTest =
  <
    C extends ParserConfiguration,
    PP extends Record<string, ParserFn<t.TypeOf<S>, any, C>>,
    S extends t.Mixed = t.Any,
    M extends t.Mixed = t.Any
  >({
    codecs,
    expectMetadata,
    expectSources,
    sourceSchema,
    metadataSchema,
    ...opts
  }: {
    name: string;
    log: Logger;
    parsers: PP;
    sourceSchema: string;
    metadataSchema: string;
    expectMetadata: (
      received: t.TypeOf<M> & { _id: string },
      expected: t.TypeOf<M> & { _id: string }
    ) => void;
    expectSources: (s: Array<t.TypeOf<S>>) => void;
  } & ParserProviderContext<t.TypeOf<S>, t.TypeOf<M>, C, PP>) =>
  async ({ sources, metadata }: any) => {
    // opts.log.debug('Sources %d', sources.length);

    // insert the sources in the db
    await opts.db.api.insertMany(
      opts.db.write,
      sourceSchema,
      sources.map((s: any) => s.html)
    );

    const result = await parseContributions({
      codecs,
      ...opts,
    })({ sources, errors: 0, overflow: false });

    printResultOutput(opts.getEntryId, {
      type: 'Success',
      payload: result,
    });

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

    expect(E.isRight(decodeResult)).toBe(true);

    expectMetadata(metadataResults[0], metadata);
  };
