/* eslint-disable import/first */
jest.mock('axios');
import {
  GuardoniExperimentArb,
  PostDirectiveSuccessResponseArb,
} from '@shared/arbitraries/Experiment.arb';
import { CommonStepArb } from '@shared/arbitraries/Step.arb';
import * as tests from '@shared/test';
import { pipe } from 'fp-ts/lib/function';
import * as fs from 'fs';
import * as path from 'path';
import { GetGuardoniCLI, GuardoniCLI } from '../../src/guardoni/cli';
import { csvStringifyTE } from '../../src/guardoni/utils';
import axiosMock from '@shared/test/__mocks__/axios.mock';
import { puppeteerMock } from '@shared/test/__mocks__/puppeteer.mock';
import {
  getProfileDataDir,
  getProfileJsonPath,
  readProfile,
} from '../../src/guardoni/profile';
import { guardoniLogger } from '../../src/logger';
import { throwTE } from '@shared/utils/task.utils';

const basePath = path.resolve(__dirname, '../../');
const profileName = 'profile-test-99';
const profileDir = getProfileDataDir(basePath, profileName);
const ytExtensionDir = path.resolve(basePath, '../yttrex/extension/build');
const tkExtensionDir = path.resolve(basePath, '../tktrex/extension/build');
const publicKey = process.env.PUBLIC_KEY as string;
const secretKey = process.env.SECRET_KEY as string;

describe('CLI', () => {
  const researchTag = 'test-tag';
  let experimentId: string;
  let guardoni: GuardoniCLI;

  jest.setTimeout(60 * 1000);

  beforeAll(async () => {
    fs.mkdirSync(path.resolve(basePath, 'experiments'), {
      recursive: true,
    });

    fs.statSync(ytExtensionDir, { throwIfNoEntry: true });
    fs.statSync(tkExtensionDir, { throwIfNoEntry: true });

    const comparisonCSVContent = await csvStringifyTE(
      tests.fc.sample(CommonStepArb, 5),
      { header: true, encoding: 'utf-8' }
    )();

    if (comparisonCSVContent._tag === 'Left') {
      throw comparisonCSVContent.left as any;
    }

    fs.writeFileSync(
      path.resolve(basePath, 'experiments/yt-experiment.csv'),
      comparisonCSVContent.right,
      'utf-8'
    );
  });

  afterAll(() => {
    if (fs.existsSync(profileDir)) {
      fs.rmSync(profileDir, {
        recursive: true,
      });
    }

    fs.rmSync(path.resolve(basePath, 'experiments/yt-experiment.csv'));
  });

  guardoni = GetGuardoniCLI(
    {
      chromePath: '/usr/bin/chrome',
      basePath,
      headless: false,
      verbose: false,
      profileName: profileName,
      tosAccepted: undefined,
      publicKey: undefined,
      secretKey: undefined,
      yt: {
        name: 'youtube',
        backend: process.env.YT_BACKEND as string,
        frontend: undefined,
        extensionDir: ytExtensionDir,
        proxy: undefined,
      },
      tk: {
        name: 'tiktok',
        backend: process.env.TK_BACKEND as string,
        frontend: undefined,
        extensionDir: tkExtensionDir,
        proxy: undefined,
      },
      loadFor: 3000,
      researchTag: researchTag,
      advScreenshotDir: undefined,
      excludeURLTag: undefined,
    },
    basePath,
    puppeteerMock,
    'youtube'
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
          message: `Failed to read csv file ${basePath}/__tests__/fake-file`,
        },
      });
    });

    test.skip('fails when csv file is incompatible with type "comparison"', async () => {
      await expect(
        guardoni.run({
          run: 'register-csv',
          file: path.resolve(basePath, 'experiments/tk-experiment.csv') as any,
        })()
      ).resolves.toMatchObject({
        _tag: 'Left',
        left: {
          name: 'CSVParseError',
          message:
            'The given CSV is not compatible with directive "comparison"',
        },
      });
    });

    test('fails when server response is an error', async () => {
      axiosMock.request.mockResolvedValueOnce({
        data: { error: { message: 'Server Error' } },
      });

      const result: any = await guardoni.run({
        run: 'register-csv',
        file: path.resolve(basePath, 'experiments/yt-experiment.csv') as any,
      })();

      expect(result).toMatchObject({
        _tag: 'Left',
        left: {
          message: 'Server Error',
        },
      });
    });

    test('succeeds with new experiment with type "comparison" and proper csv file', async () => {
      // return experiment
      axiosMock.request.mockResolvedValueOnce({
        data: {
          ...tests.fc.sample(PostDirectiveSuccessResponseArb, 1)[0],
          status: 'created',
        },
      });

      const result: any = await guardoni.run({
        run: 'register-csv',
        file: path.resolve(basePath, 'experiments/yt-experiment.csv') as any,
      })();

      expect(result).toMatchObject({
        _tag: 'Right',
        right: {
          message: 'Experiment created successfully',
        },
      });

      experimentId = result.right.values[0].experimentId;
    });

    test('success with type comparison and proper csv file', async () => {
      // return experiment
      axiosMock.request.mockResolvedValueOnce({
        data: {
          ...tests.fc.sample(PostDirectiveSuccessResponseArb, 1)[0],
          status: 'exist',
        },
      });

      const result: any = await guardoni.run({
        run: 'register-csv',
        file: path.resolve(basePath, 'experiments/yt-experiment.csv') as any,
      })();

      expect(result).toMatchObject({
        _tag: 'Right',
        right: {
          message: 'Experiment already available',
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
          message: 'Experiments List',
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
          message: 'Experiments List',
          values: steps.map((d) => ({ [d.experimentId]: d })),
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
          details: ['Invalid value "" supplied to : NonEmptyString'],
        },
      });

      // check guardoni profile count has been updated
      const guardoniProfile = await throwTE(
        readProfile({ logger: guardoniLogger })(
          path.join(profileDir, 'guardoni.json')
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
        opts: { publicKey, secretKey },
      })();

      // check guardoni profile count has been updated
      const guardoniProfile = await throwTE(
        readProfile({ logger: guardoniLogger })(
          path.join(profileDir, 'guardoni.json')
        )
      );

      expect(guardoniProfile).toMatchObject({ profileName, execount: 1 });

      // check guardoni has written proper settings.json
      // inside extension folder

      const settingJson = pipe(
        path.resolve(ytExtensionDir, 'settings.json'),
        (p) => fs.readFileSync(p, 'utf-8'),
        JSON.parse
      );

      expect(settingJson).toMatchObject({
        publicKey,
        secretKey,
        experimentId,
      });

      expect(result).toMatchObject({
        _tag: 'Right',
        right: {
          message: 'Experiment completed',
          values: [
            {
              profileName,
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
        opts: { publicKey, secretKey },
      })();

      // check guardoni profile count has been updated
      const guardoniProfile = await throwTE(
        readProfile({ logger: guardoniLogger })(
          path.join(profileDir, 'guardoni.json')
        )
      );

      expect(guardoniProfile).toMatchObject({ execount: 2 });

      expect(result).toMatchObject({
        _tag: 'Right',
        right: {
          message: 'Experiment completed',
          values: [
            {
              publicKey,
              experimentId,
              researchTag,
              profileName,
            },
          ],
        },
      });
    });
  });

  describe('auto', () => {
    test('succeeds when value is "1"', async () => {
      axiosMock.request.mockResolvedValueOnce({
        data: tests.fc.sample(CommonStepArb, 2).map((d) => ({
          ...d,
          loadFor: 1000,
          watchFor: '1s',
        })),
      });

      const result: any = await guardoni.run({ run: 'auto', value: '1' })();

      // check guardoni profile count has been updated
      const guardoniProfile = await throwTE(
        readProfile({ logger: guardoniLogger })(
          path.join(profileDir, 'guardoni.json')
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

      const result: any = await guardoni.run({ run: 'auto', value: '2' })();

      // check guardoni profile count has been updated
      const guardoniProfile = await throwTE(
        readProfile({ logger: guardoniLogger })(
          path.join(profileDir, 'guardoni.json')
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
