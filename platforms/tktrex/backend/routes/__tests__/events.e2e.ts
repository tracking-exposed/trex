import bs58 from '@shared/providers/bs58.provider';
import { fc } from '@shared/test';
import { foldTEOrThrow } from '@shared/utils/fp.utils';
import { ContributionEventArb } from '@tktrex/shared/arbitraries/ContributionEvent.arb';
import { GetTest, Test } from '../../test/Test';

const version = '9.9.9.9';
describe('Events', () => {
  let appTest: Test;

  beforeAll(async () => {
    appTest = await GetTest();
  });

  afterAll(async () => {
    await appTest.mongo.close();
  });

  describe('Add events', () => {
    test('succeeds when payload is correctly signed', async () => {
      const keys = await foldTEOrThrow(bs58.makeKeypair(''));
      const researchTag = 'test-tag';
      const data = fc.sample(ContributionEventArb, 5).map((c) => ({
        ...c,
        href: 'https://www.tiktok.com/@username',
      }));

      const signature = await foldTEOrThrow(
        bs58.makeSignature(JSON.stringify(data), keys.secretKey)
      );

      // check events
      const response = await appTest.app
        .post(`/api/v2/events`)
        .set('x-tktrex-version', version)
        .set('X-tktrex-publicKey', keys.publicKey)
        .set('x-tktrex-signature', signature)
        .set('x-tktrex-nonauthcookieid', researchTag)
        .send(data);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        supporter: {
          version,
          publicKey: keys.publicKey,
        },
        htmls: { error: false, success: data.length, subject: 'htmls' },
      });

      await appTest.mongo3.deleteMany(
        appTest.mongo,
        appTest.config.get('schema').htmls,
        { publicKey: keys.publicKey }
      );
    });
  });
});
