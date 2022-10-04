import { GetTest, Test } from '../../../tests/Test';

import { ParserProviderContextDB } from '@shared/providers/parser.provider';
import {
  readFixtureJSON,
  readFixtureJSONPaths,
  runParserTest,
} from '@shared/test/utils/parser.utils';
import { VideoMetadata } from '@yttrex/shared/models/Metadata';
import { HTMLSource, parsers } from '@yttrex/shared/parser';
import { toMetadata } from '@yttrex/shared/parser/metadata';
import base58 from 'bs58';
import { addMinutes, parseISO } from 'date-fns';
import path from 'path';
import nacl from 'tweetnacl';
import { v4 as uuid } from 'uuid';
import {
  addDom,
  getLastHTMLs,
  getMetadata,
  getMetadataSchema,
  getSourceSchema,
  updateMetadataAndMarkHTML,
} from '../../../lib/parser/html';

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
  jest.setTimeout(60 * 1000);

  /**
   * TODO:
   */

  const failingIds = [
    '63f0e7fd3b810a61983e94639861508f4d94add6',
    '1b011532a757e411c941c3d71183090013fe21b4',
    'f3db5959ddff8ba984d78989857d60ba4ee00376',
    '05b5d4a6e2e6a841a78b9596ff909e3df8d7b940',
    '1b3580b71a57ac81956bbda7b4fd07334cc5421d',
    '2ccb3096047b9b5551811743369cb6c81ee019c6',
    '48d7e8ff1dc1f8232f8f20a0402a75cfda3630e8',
    '4c7949c549cf1b56e38d79292c0d4df069fd9b66',
    '5a9e816836baa9908eba56cfd63437b5ad16c895',
    '6fd9b1377b01ba31381dec72b8dc6aab6e0d0f55',
    '7355baa16bba21648a8374a9d1c8511c8edb4f2f',
    '78f9f5010115cddd5e874b2057ad531ce08e9804',
    '7a76cf8cb659ac8df4ac841a60753182ffadb76d',
    '8da4a37c948e15282700bd5639d4b221b7cf2560',
    '96ff2226f061cf92047672a8fa0b6d5e7b055304',
    '997f3766b6d2b08184419f5ff6808ea326dfa106',
    'a3547e3e25945ee94634d5fcb919aef9959d35ad',
    'a66333a832a7a95f8e7b037d4a8fbd6f5e2c60da',
    'aa72fe41af16992afb6e78c1996dc23c10cb573a',
    'b08319624c437ebf524701725faefe693ab801df',
    'b45e6a7eac956b27e991a05791b25c90b0848ac3',
    'c6ba019fee11e27cbd68e680c1dd67a098337fe1',
    'cc17834011233eeb3972bcbc06779c551971a6ff',
    'd121dcf9c01215c61e654098034b6655d03ea0aa',
    'da5b6d65d3fc8cc3c4a34b3e3004bdd29f4efef6',
    'ea6d70a62ad47f9fa24e29e0b66e97e9b6f42858',
    'f6e86f670d04ad71550cc900a2db192ff7e5adcd',
    'ef892497ef1378c1c47db234fd65686876cdd967',
    '34e5d62e08385b1556b480d8d6ed60d974db538d',
  ];

  const historyData = readFixtureJSONPaths(
    path.resolve(__dirname, '../../fixtures/htmls/video'),
    {
      exclude: failingIds,
      // only: ['2a774685e64b855be43ab2848f260e7bd9f4ee07'],
    }
  );

  test.each(historyData)(
    'Should correctly parse video contributions %s',
    async (fixturePath) => {
      const { sources: _sources, metadata } = readFixtureJSON(
        fixturePath,
        publicKey
      );

      const sources = _sources
        .sort((a, b) => {
          const aDate = parseISO(a.clientTime);
          const bDate = parseISO(b.clientTime);
          return bDate.getTime() - aDate.getTime();
        })
        .map((h: any) => ({
          html: {
            ...h,
            id: uuid(),
            clientTime: parseISO(h.clientTime ?? new Date().toISOString()),
            savingTime: addMinutes(new Date(), 1),
            processed: null,
          },
          supporter: undefined,
        }));

      await runParserTest({
        name: 'yt-video',
        log: appTest.logger,
        db,
        sourceSchema: getSourceSchema(),
        metadataSchema: getMetadataSchema(),
        parsers,
        addDom,
        codecs: { contribution: HTMLSource, metadata: VideoMetadata },
        getEntryId: (e) => e.html.id,
        getEntryDate: (e) => e.html.savingTime,
        getEntryNatureType: (e) => e.html.nature.type ?? e.type,
        getContributions: getLastHTMLs(db),
        getMetadata: getMetadata(db),
        buildMetadata: toMetadata,
        saveResults: updateMetadataAndMarkHTML(db),
        config: {},
        expectSources: (s) => {
          s.forEach((r: any) => {
            expect(r.processed).toBe(true);
          });
        },
        expectMetadata: (receivedM: any, expectedM: any) => {
          const { related: receivedRelated, ...receivedMetadata } = receivedM;

          const {
            savingTime: _savingTime,
            clientTime: _clientTime,
            _id,
            related: expectedRelated,
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
