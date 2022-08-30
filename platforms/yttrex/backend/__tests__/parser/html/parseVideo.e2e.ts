import { VideoMetadata } from '@yttrex/shared/models/Metadata';
import { sanitizeHTML } from '@shared/utils/html.utils';
import base58 from 'bs58';
import { addMinutes, parseISO } from 'date-fns';
import { JSDOM } from 'jsdom';
import nacl from 'tweetnacl';
import {
  getLastHTMLs,
  HTMLSource,
  toMetadata,
  updateMetadataAndMarkHTML,
} from '../../../lib/parser/html';
import parseVideo  from '../../../parsers/video';
import { GetTest, Test } from '../../../tests/Test';
import {
  readHistoryResults,
  runParserTest,
} from '@shared/test/utils/parser.utils';
import path from 'path';
import { ParserProviderContextDB } from '@shared/providers/parser.provider';

describe('Parser: Video', () => {
  let appTest: Test;
  const newKeypair = nacl.sign.keyPair();
  const publicKey = base58.encode(newKeypair.publicKey);

  let db: ParserProviderContextDB;
  beforeAll(async () => {
    appTest = await GetTest();
    db = {
      api: appTest.mongo3,
      read: appTest.mongo,
      write: appTest.mongo,
    };
  });

  afterEach(async () => {
    await appTest.mongo3.deleteMany(
      appTest.mongo,
      appTest.config.get('schema').htmls,
      {
        publicKey: {
          $eq: publicKey,
        },
      }
    );
    await appTest.mongo3.deleteMany(
      appTest.mongo,
      appTest.config.get('schema').metadata,
      {
        publicKey: {
          $eq: publicKey,
        },
      }
    );
  });

  jest.useRealTimers();
  jest.setTimeout(20 * 1000);

  const historyData = readHistoryResults(
    path.resolve(__dirname, '../../fixtures/home'),
    publicKey
  );

  /**
   * TODO:
   * historyData[2] has missing related items
   * historyData[4] has missing related items
   * historyData[5] has missing related items
   * historyData[6] has missing related items
   * historyData[7] has missing related items
   * historyData[8] has missing related items
   */
  test.each([
    historyData[0],
    historyData[1],
    // historyData[2],
    historyData[3],
    historyData[4],
    // historyData[5]
    // historyData[6]
    // historyData[7]
    historyData[8],
  ])(
    'Should correctly parse video contributions',
    async ({ sources: _sources, metadata }) => {
      const sources = _sources.map((h: any) => ({
        html: {
          ...h,
          clientTime: parseISO(h.clientTime ?? new Date().toISOString()),
          savingTime: addMinutes(new Date(), 1),
          processed: null,
        },
        jsdom: new JSDOM(sanitizeHTML(h.html)).window.document,
        supporter: undefined,
      }));

      await runParserTest({
        log: appTest.logger,
        db,
        sourceSchema: appTest.config.get('schema').htmls,
        metadataSchema: appTest.config.get('schema').metadata,
        parsers: { nature: parseVideo },
        codecs: { contribution: HTMLSource, metadata: VideoMetadata },
        getEntryId: (e) => e.html.id,
        getEntryDate: (e) => e.html.savingTime,
        getEntryNatureType: (e) => e.html.nature.type ?? e.type,
        getContributions: getLastHTMLs(db),
        buildMetadata: toMetadata as any,
        saveResults: updateMetadataAndMarkHTML(db),
        expectSources: (s) => {
          s.forEach((r: any) => {
            expect(r.processed).toBe(true);
          });
        },
        expectMetadata: (receivedM: any, expectedM: any) => {
          const {
            related: receivedRelated,
            // login: receivedLogin,
            likeInfo,
            ...receivedMetadata
          } = receivedM;

          const {
            savingTime: _savingTime,
            clientTime: _clientTime,
            _id,
            id,
            // login: expectedLogin,
            related: expectedRelated,
            likeInfo: expectedLikeInfo,
            ...expectedMetadata
          } = expectedM;

          expect({
            ...receivedMetadata,
            publicationTime: receivedMetadata?.publicationTime?.toISOString(),
          }).toMatchObject({
            ...expectedMetadata,
          });

          // check metadata related
          expect(
            receivedRelated.map(
              ({ recommendedPubTime, publicationTime, ...rr }: any) => ({
                ...rr,
                foryou: rr.foryou ?? null,
              })
            )
          ).toMatchObject(
            expectedRelated.map(({ publicationTime, ...rr }: any) => rr)
          );
        },
      })({ metadata, sources });
    }
  );
});
