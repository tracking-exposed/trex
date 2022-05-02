import base58 from 'bs58';
import { parseISO, subMinutes } from 'date-fns';
import { JSDOM } from 'jsdom';
import nacl from 'tweetnacl';
import {
  getLastHTMLs,
  updateMetadataAndMarkHTML,
} from '../../../lib/parser/html';
import { VideoMetadata } from '../../../models/Metadata';
import process from '../../../parsers/video';
import { GetTest, Test } from '../../../tests/Test';
import { readHistoryResults, runParserTest } from './utils';

describe('Parser: Video', () => {
  let appTest: Test;
  const newKeypair = nacl.sign.keyPair();
  const publicKey = base58.encode(newKeypair.publicKey);

  let db;
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

  jest.setTimeout(20 * 1000);

  const historyData = readHistoryResults('video', publicKey);

  /**
   * TODO:
   * historyData[1] mismatch the related
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
  ])(
    'Should correctly parse video contributions',
    async ({ sources: _sources, metadata }) => {
      const sources = _sources.map((h: any) => ({
        ...h,
        clientTime: parseISO(h.clientTime ?? new Date().toISOString()),
        savingTime: subMinutes(new Date(), 1),
        processed: null,
      }));

      await runParserTest({
        log: appTest.logger,
        db,
        sourceSchema: appTest.config.get('schema').htmls,
        metadataSchema: appTest.config.get('schema').metadata,
        mapSource: (h: any) => {
          // console.log('plain html', h.html);
          const sanitizedHTML = h.html.replace(/(\n|\t) +/g, '');
          // console.log('sanitized html', sanitizedHTML);
          const sourceDOM = new JSDOM(sanitizedHTML, {
            beforeParse: (w) => {
              w.onload = (e) => {
                console.log('load', e);
              };
              w.onerror = (e) => {
                console.error('error', e);
              };
            },
          });
          // console.log('source dom text content', sourceDOM.window);

          return {
            html: h,
            jsdom: sourceDOM.window.document,
            supporter: undefined,
            findings: {},
          };
        },
        parsers: { video: process },
        codec: VideoMetadata,
        getEntryDate: (e) => e.html.savingTime,
        getEntryNatureType: (e) => e.html.nature.type,
        getContributions: getLastHTMLs({ db }),
        saveResults: updateMetadataAndMarkHTML({ db }),
        expectSources: (s) => {
          s.forEach((r: any) => {
            expect(r.processed).toBe(true);
          });
        },
        expectMetadata: (receivedM, expectedM) => {
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
            publicationTime: receivedMetadata.publicationTime.toISOString(),
          }).toMatchObject({
            ...expectedMetadata,
          });

          // check metadata related
          expect(
            receivedRelated.map(
              ({ recommendedPubTime, publicationTime, ...rr }) => ({
                ...rr,
                foryou: rr.foryou ?? null,
                publicationTime: publicationTime?.toISOString() ?? null,
              })
            )
          ).toMatchObject(expectedRelated.map(({ ...rr }) => rr));
        },
      })({ metadata, sources });
    }
  );
});
