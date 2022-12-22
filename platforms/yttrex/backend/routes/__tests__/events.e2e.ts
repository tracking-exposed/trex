import { Keypair } from '@shared/models/extension/Keypair';
import bs58 from '@shared/providers/bs58.provider';
import { fc } from '@shared/test';
import { foldTEOrThrow } from '@shared/utils/fp.utils';
import sizeof from 'object-sizeof';
import { GetTest, Test } from '../../tests/Test';

/* This first check the capacity of load data and verify they are avail */
describe('Event Routes', function () {
  let tests: Test;

  beforeAll(async () => {
    tests = await GetTest();
  });

  jest.setTimeout(20 * 1000);

  describe('Post events', () => {
    let keypair: Keypair;

    beforeAll(async () => {
      keypair = await foldTEOrThrow(bs58.makeKeypair('test'));

      await tests.app
        .post('/api/v2/handshake')
        .send({
          publicKey: keypair.publicKey,
          execount: 0,
        })
        .expect(200);
    });
    test('Should return a well formed error when request is too large', async () => {
      console.log('generating large json');
      const eventData = fc
        .sample(fc.json(100), 1000)
        .reduce((acc, j, i) => ({ ...acc, [i]: JSON.parse(j) }), {});

      const payload: any = Array.from({ length: 1000 }).reduce<any>(
        (acc, _, i) => ({ ...acc, [i]: eventData }),
        {}
      );

      console.log('Rough size of json object', sizeof(payload));
      const signature = await foldTEOrThrow(
        bs58.makeSignature(JSON.stringify(payload), keypair.secretKey)
      );

      const response = await tests.app
        .post('/api/v2/events')
        .send(payload)
        .set('X-yttrex-version', '2.8.0')
        .set('X-YTtrex-PublicKey', keypair.publicKey)
        .set('X-YTtrex-Signature', signature)
        .set('X-YTtrex-Build', new Date().toISOString())
        .expect(413);

      expect(response.body).toMatchObject({
        message: 'request entity too large',
      });
    });
  });
});
