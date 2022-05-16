import bs58 from '../bs58.provider';
import fc from 'fast-check';

describe('bs58 provider', () => {
  test('succeeds when payload is correctly signed', async () => {
    const keys = await bs58
      .makeKeypair('')()
      .then((r: any) => r.right);

    const data = fc.sample(fc.anything()).map((d) => JSON.stringify(d));
    const unicodeData = fc
      .sample(fc.unicodeString())
      .map((d) => JSON.stringify({ html: d }));

    [...data, ...unicodeData].forEach(async (d) => {
      const signature = await bs58
        .makeSignature(d, keys.secretKey)()
        .then((r: any) => r.right);

      const verify = await bs58
        .verifySignature(d, keys.publicKey, signature)()
        .then((r: any) => r.right);

      expect(verify).toBe(true);
    });
  });
});
