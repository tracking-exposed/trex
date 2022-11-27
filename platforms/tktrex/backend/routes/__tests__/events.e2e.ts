import { Keypair } from '@shared/models/extension/Keypair';
import bs58 from '@shared/providers/bs58.provider';
import { fc } from '@shared/test';
import { foldTEOrThrow } from '@shared/utils/fp.utils';
import {
  ContributionEventArb,
  APIRequestEventArb,
  SigiStateContributionEventArb,
} from '@tktrex/shared/arbitraries/ContributionEvent.arb';
import * as superagent from 'superagent';
import { GetTest, Test } from '../../test/Test';

export type EventsPoster = <A>(
  keys: Keypair,
  arb: fc.Arbitrary<A>,
  count: number,
  mapData: (c: A, i: number) => A
) => Promise<{
  response: superagent.Response;
  data: A[];
}>;

/**
 * Utility to create new events by sending http requests
 * @param appTest Test
 * @returns a function to call to generate new events
 */

export const GetEventsPoster =
  (appTest: Test) =>
  async <A>(
    keys: Keypair,
    arb: fc.Arbitrary<A>,
    count: number,
    mapData: (c: A, i: number) => A
  ): Promise<{
    response: superagent.Response;
    data: A[];
  }> => {
    const data = fc.sample(arb, count).map(mapData);

    const signature = await foldTEOrThrow(
      bs58.makeSignature(JSON.stringify(data), keys.secretKey)
    );

    // check events
    return appTest.app
      .post(`/api/v2/events`)
      .set('x-tktrex-build', new Date().toISOString())
      .set('x-tktrex-version', version)
      .set('x-tktrex-publicKey', keys.publicKey)
      .set('x-tktrex-signature', signature)
      .set('x-tktrex-nonauthcookieid', 'local')
      .send(data)
      .then((response) => ({
        response,
        data,
      }));
  };

const version = '9.9.9.9';
describe('Events Route', () => {
  let appTest: Test;
  let postEvents: EventsPoster;

  beforeAll(async () => {
    appTest = await GetTest();
    postEvents = GetEventsPoster(appTest);
  });

  afterAll(async () => {
    await appTest.mongo.close();
  });

  describe('Add events', () => {
    test('succeeds when payload is correctly signed', async () => {
      const keys = await foldTEOrThrow(bs58.makeKeypair(''));
      const researchTag = 'test-tag';
      const { data, response } = await postEvents(
        keys,
        ContributionEventArb,
        5,
        (c) => ({
          ...c,
          href: 'https://www.tiktok.com/@username',
        })
      );

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        supporter: {
          version,
          publicKey: keys.publicKey,
        },
        htmls: { error: false, success: data.length, subject: 'htmls' },
        apiRequests: { error: null, subject: 'apiRequests' },
        sigiStates: { error: null, subject: 'sigiStates' },
      });

      await appTest.mongo3.deleteMany(
        appTest.mongo,
        appTest.config.get('schema').htmls,
        { publicKey: keys.publicKey }
      );
    });
  });

  describe('Add "api" events', () => {
    test('succeeds when payload is correctly signed', async () => {
      const keys = await foldTEOrThrow(bs58.makeKeypair(''));
      const { response, data } = await postEvents(
        keys,
        APIRequestEventArb,
        5,
        (c) => ({
          ...c,
          href: 'https://www.tiktok.com/@username',
        })
      );

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        supporter: {
          version,
          publicKey: keys.publicKey,
        },
        apiRequests: {
          error: false,
          success: data.length,
          subject: 'apiRequests',
        },
      });

      await appTest.mongo3.deleteMany(
        appTest.mongo,
        appTest.config.get('schema').apiRequests,
        { publicKey: keys.publicKey }
      );
    });

    test('succeeds when payload contains event different from "api"', async () => {
      const keys = await foldTEOrThrow(bs58.makeKeypair(''));
      const { response, data } = await postEvents(
        keys,
        APIRequestEventArb,
        10,
        (c, i) => ({
          ...c,
          type: i % 2 == 0 ? c.type : ('invalid' as any),
          href: 'https://www.tiktok.com/@username',
        })
      );

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        supporter: {
          version,
          publicKey: keys.publicKey,
        },
        apiRequests: {
          error: false,
          success: data.length / 2,
          subject: 'apiRequests',
        },
      });

      await appTest.mongo3.deleteMany(
        appTest.mongo,
        appTest.config.get('schema').apiRequests,
        { publicKey: keys.publicKey }
      );
    });
  });

  describe('Add "sigiState" event', () => {
    test('success when payload contains only "sigiState" contribution events', async () => {
      const keys = await foldTEOrThrow(bs58.makeKeypair(''));
      const { response, data } = await postEvents(
        keys,
        SigiStateContributionEventArb,
        10,
        (c, i) => ({
          ...c,
          type: i % 2 == 0 ? c.type : ('invalid' as any),
          href: 'https://www.tiktok.com/@username',
        })
      );

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        supporter: {
          version,
          publicKey: keys.publicKey,
        },
        apiRequests: {
          error: null,
          subject: 'apiRequests',
        },
        sigiStates: {
          error: false,
          success: data.length / 2,
          subject: 'sigiStates',
        },
      });

      await appTest.mongo3.deleteMany(
        appTest.mongo,
        appTest.config.get('schema').apiRequests,
        { publicKey: keys.publicKey }
      );
    });
  });
});
