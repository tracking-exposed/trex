/* eslint-disable import/first */
// mock curly module
jest.mock('../../lib/curly');
jest.mock('fetch-opengraph');

import { CommonStepArb } from '@shared/arbitraries/Step.arb';
import { fc } from '@shared/test';
import { GetTest, Test } from '../../tests/Test';
import { timeconv } from '../directives';

describe('Directives API', () => {
  let appTest: Test;

  beforeAll(async () => {
    appTest = await GetTest();
  });

  afterAll(async () => {
    await appTest.mongo.close();
  });

  describe('Create a directive', () => {
    test('succeeds with 3 steps', async () => {
      const steps = fc.sample(CommonStepArb, 3);

      const { body } = await appTest.app
        .post(`/api/v2/directives`)
        .send(steps)
        .expect(200);

      expect(body.experimentId).toBeTruthy();

      const dbSteps = await appTest.mongo3.readLimit(
        appTest.mongo,
        appTest.config.get('schema').experiments,
        {
          experimentId: body.experimentId,
        },
        { savingTime: -1 },
        10,
        0
      );

      const convertedSteps = steps.map((s) => ({
        ...s,
        watchFor: timeconv(s.watchFor, 20123),
      }));

      expect(dbSteps).toMatchObject([
        {
          links: convertedSteps,
        },
      ]);

      const experimentResponse = await appTest.app
        .get(`/api/v2/directives/${body.experimentId}`)
        .expect(200);

      expect(experimentResponse.body).toMatchObject(convertedSteps);

      await appTest.mongo3.deleteMany(
        appTest.mongo,
        appTest.config.get('schema').experiments,
        {
          experimentId: body.experimentId,
        }
      );
    });
  });
});
