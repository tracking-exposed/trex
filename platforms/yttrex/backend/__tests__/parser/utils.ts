import { parseISO, subMinutes } from 'date-fns';
import * as E from 'fp-ts/lib/Either';
import * as fs from 'fs';
import * as t from 'io-ts';
import { failure } from 'io-ts/lib/PathReporter';
import { JSDOM } from 'jsdom';
import * as path from 'path';
import { parseHTMLs } from '../../lib/parser/parser';
import { ParserFn } from '../../lib/parser/types';
import { HTML } from '../../models/HTML';
import { toMetadata } from '../../parsers';
import { Test } from '../../tests/Test';

/**
 * Read the parsed metadata history from '../fixtures/${nature}'
 */
export const readHistoryResults = (parserName: string, publicKey: string) => {
  return fs
    .readdirSync(path.resolve(__dirname, '../fixtures', parserName), 'utf-8')
    .filter((file) => file.includes('.json'))
    .map((dir) => {
      const content = fs.readFileSync(
        path.resolve(__dirname, '../fixtures', parserName, dir),
        'utf-8'
      );
      return JSON.parse(content);
    })
    .map((mt) => ({
      ...mt,
      htmls: mt.htmls.map((h: any) => ({
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

type MetadataResult<T> = T & { htmls: HTML[]; _id: string };

export const runParserTest =
  <T extends t.Mixed>(
    appTest: Test,
    parsers: Record<string, ParserFn>,
    codec: T,
    expectMetadata: (
      storedM: MetadataResult<t.TypeOf<typeof codec>>,
      newM: MetadataResult<t.TypeOf<typeof codec>>
    ) => void
  ) =>
  async ({ htmls: _htmls, metadata }: any) => {
    // appTest.debug('Metadata %O', metadata);
    // appTest.debug('Metadata htmls %O', htmls);
    // insert the htmls in the db
    const htmls = _htmls.map((h: any) => ({
      ...h,
      clientTime: parseISO(h.clientTime),
      savingTime: subMinutes(new Date(), 1),
      processed: null,
    }));
    await appTest.mongo3.insertMany(
      appTest.mongo,
      appTest.config.get('schema').htmls,
      htmls
    );

    // run parser with specific configuration
    const result = await parseHTMLs({
      toMetadata,
      db: {
        api: appTest.mongo3,
        read: appTest.mongo,
        write: appTest.mongo,
      },
      parsers,
    })({
      overflow: false,
      errors: 0,
      sources: htmls.map((h: any) => ({
        html: h,
        jsdom: new JSDOM(h.html.replace(/\n +/g, '')).window.document,
        supporter: undefined,
        findings: {},
      })),
    });

    // appTest.debug('Result %O', result);

    // check data in db has changed
    const updatedHTMLs = await appTest.mongo3.aggregate(
      appTest.mongo,
      appTest.config.get('schema').htmls,
      [
        { $match: { id: { $in: htmls.map((h: HTML) => h.id) } } },
        { $sort: { clientTime: -1 } },
      ]
    );

    updatedHTMLs.forEach((r: any) => {
      expect(r.processed).toBe(true);
    });

    expect(result?.metadata[0]).toBeTruthy();

    result?.metadata.forEach((m) => {
      const decodeResult = codec.decode({
        ...m,
        clientTime: new Date(m.clientTime as any),
      });

      if (decodeResult._tag === 'Left') {
        console.log(failure(decodeResult.left));
      }

      expect(E.isRight(decodeResult)).toBe(true);

      expectMetadata(metadata, m as any);
    });
  };
