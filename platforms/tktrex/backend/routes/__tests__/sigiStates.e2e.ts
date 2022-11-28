import bs58 from '@shared/providers/bs58.provider';
import { fc } from '@shared/test';
import { string2Food } from '@shared/utils/food.utils';
import { foldTEOrThrow } from '@shared/utils/fp.utils';
import { SigiStateContributionEventArb } from '@tktrex/shared/arbitraries/ContributionEvent.arb';
import { GetTest, Test } from '../../test/Test';
import { EventsPoster, GetEventsPoster } from './events.e2e';

const version = '9.9.9.9';

describe('Sigi States Route', () => {
  let appTest: Test;
  let postEvents: EventsPoster;

  beforeAll(async () => {
    appTest = await GetTest();
    postEvents = GetEventsPoster(appTest);
  });

  afterAll(async () => {
    await appTest.mongo.close();
  });

  describe('List sigi states', () => {
    test('Get all events sent', async () => {
      const keys = await foldTEOrThrow(bs58.makeKeypair(''));
      let { data, response } = await postEvents(
        keys,
        SigiStateContributionEventArb,
        10,
        (c, i) => ({
          ...c,
          href: 'https://www.tiktok.com/@username',
        })
      );

      expect(response.status).toBe(200);

      response = await appTest.app
        .get(`/api/v2/sigiStates`)
        .query({ publicKey: keys.publicKey });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        total: data.length,
        data: data.map((d) => ({
          supporter: string2Food(keys.publicKey),
          clientTime: d.clientTime,
        })),
      });

      await appTest.mongo3.deleteMany(
        appTest.mongo,
        appTest.config.get('schema').sigiStates,
        { publicKey: keys.publicKey }
      );
    });

    test('Get events by experimentId', async () => {
      const experimentId = fc.sample(fc.uuid(), 1)[0];
      const keys = await foldTEOrThrow(bs58.makeKeypair(''));
      const { data } = await postEvents(
        keys,
        SigiStateContributionEventArb,
        10,
        (c, i) => ({
          ...c,
          experimentId: i % 2 ? experimentId : undefined,
          href: 'https://www.tiktok.com/@username',
        })
      );

      const response = await appTest.app
        .get(`/api/v2/sigiStates`)
        .query({ publicKey: keys.publicKey, experimentId });

      expect(response.status).toBe(200);

      expect(response.body).toMatchObject({
        total: data.length / 2,
        data: data
          .filter((d, i) => i % 2 == 0)
          .map((d) => ({
            supporter: string2Food(keys.publicKey),
            experimentId,
          })),
      });

      await appTest.mongo3.deleteMany(
        appTest.mongo,
        appTest.config.get('schema').sigiStates,
        { publicKey: keys.publicKey }
      );
    });
  });
});
