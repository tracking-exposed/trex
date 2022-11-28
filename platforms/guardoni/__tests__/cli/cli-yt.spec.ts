/* eslint-disable import/first */
jest.mock('axios');
import {
  GuardoniExperimentArb,
  PostDirectiveSuccessResponseArb,
} from '@shared/arbitraries/Experiment.arb';
import { CommonStepArb } from '@shared/arbitraries/Step.arb';
import axiosMock from '@shared/test/__mocks__/axios.mock';
import { puppeteerMock } from '@shared/test/__mocks__/puppeteer.mock';
import { throwTE } from '@shared/utils/task.utils';
import { pipe } from 'fp-ts/lib/function';
import * as fs from 'fs';
import { NonEmptyString } from 'io-ts-types/lib/NonEmptyString';
import * as path from 'path';
import { GetGuardoniCLI, GuardoniCLI } from '../../src/guardoni/cli';
import { formatExperimentList } from '../../src/guardoni/experiment';
import { getProfileDataDir, readProfile } from '../../src/guardoni/profile';
import { LATEST_RELEASE_URL } from '../../src/guardoni/update-notifier';
import { guardoniLogger } from '../../src/logger';
import { GetTests, Tests } from '../../test';
import { TestCSV, writeExperimentCSV } from '../../test/writeExperimentCSV';

describe('CLI', () => {
  const researchTag = 'test-tag';
  let experimentId: string;
  let guardoni: GuardoniCLI;
  let tests: Tests;
  let csv: TestCSV;

  jest.setTimeout(60 * 1000);

  beforeAll(async () => {
    tests = GetTests('yt-test');

    csv = await writeExperimentCSV(
      tests.basePath,
      tests.fc.sample(CommonStepArb, 5).map((s) => ({
        ...s,
        type: 'openURL',
        loadFor: undefined,
        onCompleted: undefined,
      })),
      'yt-experiment.csv'
    );

    guardoni = GetGuardoniCLI(
      {
        chromePath: '/usr/bin/chrome',
        basePath: tests.basePath,
        headless: false,
        verbose: false,
        profileName: tests.profileName,
        tosAccepted: undefined,
        publicKey: undefined,
        secretKey: undefined,
        yt: {
          name: 'youtube',
          backend: process.env.YT_BACKEND as string,
          frontend: undefined,
          extensionDir: tests.ytExtensionDir,
          proxy: undefined,
        },
        tk: {
          name: 'tiktok',
          backend: process.env.TK_BACKEND as string,
          frontend: undefined,
          extensionDir: tests.tkExtensionDir,
          proxy: undefined,
        },
        loadFor: 3000,
        researchTag: researchTag,
        advScreenshotDir: undefined,
        excludeURLTag: undefined,
      },
      tests.basePath,
      puppeteerMock,
      'youtube'
    );
  });

  afterAll(() => {
    tests.afterAll();
    csv.remove();
  });

  axiosMock.get.mockImplementationOnce(() =>
    Promise.resolve({
      request: {
        res: {
          responseUrl: LATEST_RELEASE_URL.replace(
            'latest',
            `v${process.env.VERSION}`
          ),
        },
      },
    })
  );

  describe('Register an experiment from a CSV', () => {
    test('fails when the file path is wrong', async () => {
      // mocks

      await expect(
        guardoni.run({
          run: 'register-csv',
          file: path.resolve(__dirname, '../fake-file') as any,
        })()
      ).resolves.toMatchObject({
        _tag: 'Left',
        left: {
          message: `Failed to read csv file ${tests.basePath}/__tests__/fake-file`,
        },
      });
    });

    test('fails when server response is an error', async () => {
      axiosMock.request.mockResolvedValueOnce({
        data: { error: { message: 'Server Error' } },
      });

      const result: any = await guardoni.run({
        run: 'register-csv',
        file: csv.output,
      })();

      expect(result).toMatchObject({
        _tag: 'Left',
        left: {
          message: 'Server Error',
        },
      });
    });

    test('succeeds when csv is correctly formatted', async () => {
      // return experiment
      axiosMock.request.mockResolvedValueOnce({
        data: {
          ...tests.fc.sample(PostDirectiveSuccessResponseArb, 1)[0],
          status: 'created',
        },
      });

      const result: any = await guardoni.run({
        run: 'register-csv',
        file: csv.output as NonEmptyString,
      })();

      expect(result).toMatchObject({
        _tag: 'Right',
        right: {
          message: 'Experiment created successfully',
        },
      });

      experimentId = result.right.values[0].experimentId;
    });
  });

  describe('List public experiments', () => {
    test('succeeds with empty list', async () => {
      // return steps
      axiosMock.request.mockResolvedValueOnce({
        data: [],
      });

      const result: any = await guardoni.run({
        run: 'list',
      })();

      expect(result).toMatchObject({
        _tag: 'Right',
        right: {
          message: 'Public Experiments Available',
          values: [
            {
              experiments: [],
            },
          ],
        },
      });
    });

    test('succeeds with some results', async () => {
      const steps = tests.fc.sample(GuardoniExperimentArb, 2);
      // return steps
      axiosMock.request.mockResolvedValueOnce({
        data: steps,
      });

      const result: any = await guardoni.run({
        run: 'list',
      })();

      expect(result).toMatchObject({
        _tag: 'Right',
        right: {
          message: 'Public Experiments Available',
          values: formatExperimentList(steps),
        },
      });
    });
  });

  describe('Run experiment', () => {
    test('fails when experiment id is empty', async () => {
      await expect(
        guardoni.run({ run: 'experiment', experiment: '' as any })()
      ).resolves.toMatchObject({
        _tag: 'Left',
        left: {
          message: 'Empty experiment id',
          details: {
            errors: ['Invalid value "" supplied to : NonEmptyString'],
          },
        },
      });

      // check guardoni profile count has been updated
      const guardoniProfile = await throwTE(
        readProfile({ logger: guardoniLogger })(
          path.join(tests.profileDir, 'guardoni.json')
        )
      );

      expect(guardoniProfile).toMatchObject({ execount: 0 });
    });

    test('succeed when experimentId has valid "yt" directives', async () => {
      axiosMock.request.mockResolvedValueOnce({
        data: tests.fc.sample(CommonStepArb, 2).map((d) => ({
          ...d,
          loadFor: 1000,
          watchFor: '1s',
        })),
      });

      const result: any = await guardoni.run({
        run: 'experiment',
        experiment: experimentId as any,
        opts: { publicKey: tests.publicKey, secretKey: tests.secretKey },
      })();

      // check guardoni profile count has been updated
      const guardoniProfile = await throwTE(
        readProfile({ logger: guardoniLogger })(
          path.join(tests.profileDir, 'guardoni.json')
        )
      );

      expect(guardoniProfile).toMatchObject({
        profileName: tests.profileName,
        execount: 1,
      });

      // check guardoni has written proper settings.json
      // inside extension folder

      const settingJson = pipe(
        path.resolve(tests.ytExtensionDir, 'settings.json'),
        (p) => fs.readFileSync(p, 'utf-8'),
        JSON.parse
      );

      expect(settingJson).toMatchObject({
        active: true,
      });

      expect(result).toMatchObject({
        _tag: 'Right',
        right: {
          message: 'Experiment completed',
          values: [
            {
              profileName: tests.profileName,
              researchTag,
              experimentId,
            },
          ],
        },
      });
    });

    test('succeed when experimentId has valid "yt" steps', async () => {
      axiosMock.request.mockResolvedValueOnce({
        data: tests.fc.sample(CommonStepArb, 2).map((d) => ({
          ...d,
          loadFor: 1000,
          watchFor: '1s',
        })),
      });

      const result: any = await guardoni.run({
        run: 'experiment',
        experiment: experimentId as any,
        opts: { publicKey: tests.publicKey, secretKey: tests.secretKey },
      })();

      // check guardoni profile count has been updated
      const guardoniProfile = await throwTE(
        readProfile({ logger: guardoniLogger })(
          path.join(tests.profileDir, 'guardoni.json')
        )
      );

      expect(guardoniProfile).toMatchObject({ execount: 2 });

      expect(result).toMatchObject({
        _tag: 'Right',
        right: {
          message: 'Experiment completed',
          values: [
            {
              publicKey: tests.publicKey,
              experimentId,
              researchTag,
              profileName: tests.profileName,
            },
          ],
        },
      });
    });
  });

  describe.skip('auto', () => {
    test('succeeds when value is "1"', async () => {
      axiosMock.request.mockResolvedValueOnce({
        data: tests.fc.sample(CommonStepArb, 2).map((d) => ({
          ...d,
          loadFor: 1000,
          watchFor: '1s',
        })),
      });

      const result: any = await guardoni.run({ run: 'list' })();

      // check guardoni profile count has been updated
      const guardoniProfile = await throwTE(
        readProfile({ logger: guardoniLogger })(
          path.join(tests.profileDir, 'guardoni.json')
        )
      );

      expect(guardoniProfile).toMatchObject({ execount: 3 });

      expect(result).toMatchObject({
        _tag: 'Right',
        right: {
          message: 'Experiment completed',
          values: [
            {
              researchTag,
            },
          ],
        },
      });
    });

    test('succeeds when value is "2"', async () => {
      axiosMock.request.mockResolvedValueOnce({
        data: tests.fc.sample(CommonStepArb, 10).map((d) => ({
          ...d,
          watchFor: '1s',
        })),
      });

      const result: any = await guardoni.run({ run: 'list' })();

      // check guardoni profile count has been updated
      const guardoniProfile = await throwTE(
        readProfile({ logger: guardoniLogger })(
          path.join(tests.profileDir, 'guardoni.json')
        )
      );

      expect(guardoniProfile).toMatchObject({ execount: 4 });

      expect(result).toMatchObject({
        _tag: 'Right',
        right: {
          message: 'Experiment completed',
          values: [{}],
        },
      });
    });
  });
});
