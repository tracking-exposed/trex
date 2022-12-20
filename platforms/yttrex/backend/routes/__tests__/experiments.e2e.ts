/* eslint-disable import/first */
// mock curly module
jest.mock('fetch-opengraph');

// import test utils
import { CommonStepArb } from '@shared/arbitraries/Step.arb';
import { fc } from '@shared/test';
import { GetTest, Test } from '../../tests/Test';

describe('Experiments API', () => {
  let test: Test;

  beforeAll(async () => {
    test = await GetTest();
  });

  afterAll(async () => {
    await test.mongo.close();
  });

  describe('POST /v2/directives', () => {
    it('fails with an incorrect experiment', async () => {
      const { body } = await test.app
        .post(`/api/v2/directives`)
        .send({})
        .expect(500);

      expect(body).toMatchObject({});
    });

    it('succeeds with a correct experiment', async () => {
      const steps = fc.sample(CommonStepArb, 10);

      const { body } = await test.app
        .post(`/api/v2/directives`)
        .send(steps)
        .expect(200);

      expect(body).toMatchObject({
        status: 'created',
      });

      await test.mongo3.deleteMany(
        test.mongo,
        test.config.get('schema').experiments,
        { experimentId: body.experimentId }
      );
    });
  });
});
