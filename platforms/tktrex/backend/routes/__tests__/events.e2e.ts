import { fc } from '@shared/test';
import { foldTEOrThrow } from '@shared/utils/fp.utils';
import { v4 as uuid } from 'uuid';
import { GetTest, Test } from '../../test/Test';
import bs58 from '@shared/providers/bs58.provider';

const version = '9.9.9.9';
describe('Events', () => {
  const channelId = uuid();
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
      const data = fc.sample(fc.anything(), 5);

      const signature = await foldTEOrThrow(
        bs58.makeSignature(JSON.stringify(data), keys.secretKey)
      );

      console.log({ signature });

      // check events
      const response = await appTest.app
        .post(`/api/v2/events`)
        .set('x-tktrex-version', version)
        .set('X-Tktrex-publicKey', keys.publicKey)
        .set('x-tktrex-signature', signature)
        .send(data);

      console.log(response.body);
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        supporter: {
          version,
          publicKey: keys.publicKey,
        },
      });

      await appTest.mongo3.deleteMany(
        appTest.mongo,
        appTest.config.get('schema').htmls,
        { publicKey: keys.publicKey }
      );
    });
  });
});
