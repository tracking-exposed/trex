import base58 from 'bs58';
import moment, { duration } from 'moment';
import nacl from 'tweetnacl';
import { getPublicationTime, parser } from '../../parsers/longlabel';
import { GetTest, Test } from '../../tests/Test';

describe('Parser: Long Label', () => {
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

  describe.only('getPublicationTime', () => {
    test('succeeds with timePrecision equal to "error" when "recommendedPubTime" is not provided', () => {
      const label = '1 day ago 8 minutes, 46 seconds';
      const receivedPublicationTime = getPublicationTime(label);

      expect(receivedPublicationTime).toStrictEqual(
        duration({ day: 1, minutes: 8, seconds: 46 })
      );
    });

    test('succeeds when parsing the entire label', () => {
      const label: [string, string, any][] = [
        // [
        //   'Pourquoi sortir le pied de la couette est-il si efficace ? de Scilabus il y a 1 an 13 minutes et 39 secondes 1 052 309 vues Scilabus',
        //   {
        //     views: 1052309,
        //     isLive: false,
        //   },
        // ],
        [
          'Why I’m Keeping the Apple Mac Studio but Am Ditching the Studio Display // What I Got Instead 👀 by JAde Wii 1 day ago 8 minutes, 46 seconds 2,006 views',
          'JAde Wii',
          {
            views: 2006,
            isLive: false,
            timeago: moment.duration({ days: 1, minutes: 8, seconds: 46 }),
          },
        ],
      ];
      label.forEach(([l, authorSource, expectedResult]) => {
        const parseResult = parser(l, authorSource, false);
        expect(parseResult).toMatchObject(expectedResult);
      });
    });
  });
});
