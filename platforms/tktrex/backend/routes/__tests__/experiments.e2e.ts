/* eslint-disable import/first */
// mock curly module
jest.mock('fetch-opengraph');

// import test utils
import { fc } from '@shared/test';
import { GuardoniExperimentArb } from '@shared/arbitraries/Experiment.arb';
import { GetTest, Test } from '../../test/Test';

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
        .expect(400);

      expect(body).toMatchObject({
        message: "Can't register an experiment with no steps",
      });
    });

    it('succeeds with a correct experiment', async () => {
      const experiment = fc.sample(GuardoniExperimentArb, 1)[0];
      const { body } = await test.app
        .post(`/api/v2/directives`)
        .send(experiment.steps)
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
