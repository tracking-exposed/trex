/* eslint-disable import/first */
// mock curly module
jest.mock('../../lib/curly');
jest.mock('fetch-opengraph');

// import test utils
import { fc } from '@shared/test';
import _ from 'lodash';
import { v4 as uuid } from 'uuid';
import {
  ParsedInfoArb,
  VideoMetadataArb,
} from '../../tests/arbitraries/Metadata.arb';
import { GetTest, Test } from '../../tests/Test';

describe('The Public API', () => {
  const channelId = uuid();
  let test: Test;

  beforeAll(async () => {
    test = await GetTest();
  });

  afterAll(async () => {
    await test.mongo.close();
  });

  describe('v1', () => {
    describe('GET /v1/home', () => {
      it('returns home list', async () => {
        const { body } = await test.app.get(`/api/v1/home`).expect(200);

        expect(body).toBeInstanceOf(Array);
      });
    });
  });
});
