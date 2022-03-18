import base58 from 'bs58';
import { subMinutes } from 'date-fns';
import * as fc from 'fast-check';
import nacl from 'tweetnacl';
import { GetParserProvider } from '../lib/parser.provider';
import { HomeMetadata } from '../models/Metadata';
import { HTMLArb } from '../tests/arbitraries/HTML.arb';
import { HomeMetadataArb } from '../tests/arbitraries/Metadata.arb';
import { HTMLMetadataResult } from '../tests/arbitraries/parsers/Home.arb';
import { GetTest, Test } from '../tests/Test';

describe('Parserv', () => {
  let appTest: Test;
  const newKeypair = nacl.sign.keyPair();
  const publicKey = base58.encode(newKeypair.publicKey);

  beforeAll(async () => {
    appTest = await GetTest();
  });

  describe('ADS', () => {
    jest.setTimeout(20 * 1000);

    test('Should parse data contribution', async () => {
      // create 10 random `html` documents
      const htmls = fc.sample(HTMLArb, 10).map((entry) => ({
        ...entry,
        publicKey,
        html: '',
        nature: {
          type: 'home',
        },
        processed: null,
        savingTime: subMinutes(new Date(), 1),
        clientTime: subMinutes(new Date(), 2),
      }));

      // store the `html` documents in the proper collection
      const result = await appTest.mongo3.insertMany(
        appTest.mongo,
        appTest.config.get('schema').htmls,
        htmls
      );

      const insertedIds = Object.values(result.insertedIds);

      // create metadata for first created `html` document
      const metadata = fc.sample(HTMLMetadataResult).map((hm) => ({
        ...hm,
        id: htmls[0].id,
        metadataId: fc.sample(fc.uuid(), 1)[0],
      }));

      const homeParserMock = jest
        .fn()
        .mockImplementation(() => Promise.resolve(metadata[0]));

      // run parser with specific configuration
      await GetParserProvider({
        db: { api: appTest.mongo3, read: appTest.mongo, write: appTest.mongo },
        parsers: {
          home: homeParserMock,
        },
        toMetadata: (r): HomeMetadata => {
          return fc.sample(HomeMetadataArb, 1).map((hm) => ({
            ...hm,
            id: htmls[0].id,
          }))[0] as any;
        },
      }).run({
        backInTime: 10,
        stop: 10,
        repeat: false,
        singleUse: true,
        htmlAmount: 1,
      });

      // check data in db has changed

      const updatedResults = await appTest.mongo3.readLimit(
        appTest.mongo,
        appTest.config.get('schema').htmls,
        {
          id: {
            $in: htmls.map((h) => h.id),
          },
        },
        { savingTime: -1 },
        20
      );

      // console.log(updatedResults);

      expect(updatedResults).toHaveLength(htmls.length);

      // only the first result should be "processed"
      const [firstResult, ...otherResults] = updatedResults;
      expect(firstResult.processed).toBe(true);
      otherResults.forEach((r) => {
        expect(r.processed).toBe(null);
      });

      const updatedMetadata = await appTest.mongo3.readLimit(
        appTest.mongo,
        appTest.config.get('schema').metadata,
        {
          id: {
            $in: [htmls[0].id],
          },
        },
        { savingTime: -1 },
        20
      );

      expect(updatedMetadata).toHaveLength(1);

      await appTest.mongo3.deleteMany(
        appTest.mongo,
        appTest.config.get('schema').htmls,
        {
          _id: {
            $in: insertedIds,
          },
        }
      );
    });
  });
});
