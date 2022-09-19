/* eslint-disable import/first */
jest.mock('axios');
import { CommonStepArb } from '@shared/arbitraries/Step.arb';
import {
  GuardoniExperimentArb,
  PostDirectiveSuccessResponseArb,
} from '@shared/arbitraries/Experiment.arb';
import * as tests from '@shared/test';
import differenceInMilliseconds from 'date-fns/differenceInMilliseconds';
import * as fs from 'fs';
import * as path from 'path';
import { GetGuardoniCLI, GuardoniCLI } from '../../src/guardoni/cli';
import { csvStringifyTE } from '../../src/guardoni/utils';
import axiosMock from '@shared/test/__mocks__/axios.mock';
import { puppeteerMock } from '@shared/test/__mocks__/puppeteer.mock';
import { formatExperimentList } from '../../src/guardoni/experiment';
import { LATEST_RELEASE_URL } from '../../src/guardoni/update-notifier';

const basePath = path.resolve(__dirname, '../../');
const profileName = 'profile-tk-test-99';
const ytExtensionDir = path.resolve(basePath, '../yttrex/extension/build');
const tkExtensionDir = path.resolve(basePath, '../tktrex/extension/build');
const publicKey = process.env.PUBLIC_KEY;
const secretKey = process.env.SECRET_KEY;

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
      path.resolve(basePath, 'experiments/tk-experiment.csv'),
      comparisonCSVContent.right,
      'utf-8'
    );

    const searchCSVContent = await csvStringifyTE(
      tests.fc.sample(CommonStepArb, 10),
      { header: true, encoding: 'utf-8' }
    )();

    if (searchCSVContent._tag === 'Left') {
      throw searchCSVContent.left as any;
    }

    fs.writeFileSync(
      path.resolve(basePath, 'experiments/tk-experiment.csv'),
      searchCSVContent.right,
      'utf-8'
    );
  });

  afterAll(() => {
    const profileDir = path.resolve(basePath, 'profiles', profileName);
    if (fs.existsSync(profileDir)) {
      fs.rmSync(profileDir, {
        recursive: true,
      });
    }

    fs.rmSync(path.resolve(basePath, 'experiments/tk-experiment.csv'));
  });

  guardoni = GetGuardoniCLI(
    {
      chromePath: '/usr/bin/chrome',
      basePath: './',
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
      researchTag,
      advScreenshotDir: undefined,
      excludeURLTag: undefined,
    },
    basePath,
    puppeteerMock,
    'tiktok'
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

    test.skip('fails when csv file is incompatible with type "search"', async () => {
      await expect(
        guardoni.run({
          run: 'register-csv',
          file: path.resolve(basePath, 'experiments/yt-experiment.csv') as any,
        })()
      ).resolves.toMatchObject({
        _tag: 'Left',
        left: {
          name: 'CSVParseError',
          message: 'The given CSV is not compatible with directive "search"',
        },
      });
    });

    test('fails when server response is an error', async () => {
      axiosMock.request.mockResolvedValueOnce({
        data: { error: { message: 'Server Error' } },
      });

      const result: any = await guardoni.run({
        run: 'register-csv',
        file: path.resolve(basePath, 'experiments/tk-experiment.csv') as any,
      })();

      expect(result).toMatchObject({
        _tag: 'Left',
        left: {
          message: 'Server Error',
        },
      });
    });

    test('succeeds with new experiment with type "search" and proper csv file', async () => {
      // return experiment
      axiosMock.request.mockResolvedValueOnce({
        data: {
          ...tests.fc.sample(PostDirectiveSuccessResponseArb, 1)[0],
          status: 'created',
        },
      });

      const result: any = await guardoni.run({
        run: 'register-csv',
        file: path.resolve(basePath, 'experiments/tk-experiment.csv') as any,
      })();

      expect(result).toMatchObject({
        _tag: 'Right',
        right: {
          message: 'Experiment created successfully',
        },
      });

      experimentId = result.right.values[0].experimentId;
    });

    test('success with type "search" and proper csv file', async () => {
      // return experiment
      axiosMock.request.mockResolvedValueOnce({
        data: {
          ...tests.fc.sample(PostDirectiveSuccessResponseArb, 1)[0],
          status: 'exist',
        },
      });

      const result: any = await guardoni.run({
        run: 'register-csv',
        file: path.resolve(basePath, 'experiments/tk-experiment.csv') as any,
      })();

      expect(result).toMatchObject({
        _tag: 'Right',
        right: {
          message: 'Experiment already available',
        },
      });

      experimentId = result.right.values[0].experimentId;
    });

    test('succeeds with type "search" and proper csv file', async () => {
      // return experiment
      axiosMock.request.mockResolvedValueOnce({
        data: {
          ...tests.fc.sample(PostDirectiveSuccessResponseArb, 1)[0],
          status: 'exist',
        },
      });

      const result: any = await guardoni.run({
        run: 'register-csv',
        file: path.resolve(basePath, 'experiments/tk-experiment.csv') as any,
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

  describe('experiment', () => {
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
    });

    test('succeed when experimentId has valid "tk" steps', async () => {
      axiosMock.request.mockResolvedValueOnce({
        data: tests.fc.sample(CommonStepArb, 2).map((d) => ({
          ...d,
          loadFor: 1500,
          watchFor: '1s',
        })),
      });

      const start = new Date();
      const result: any = await guardoni.run({
        run: 'experiment',
        experiment: experimentId as any,
      })();
      const end = new Date();

      expect(result).toMatchObject({
        _tag: 'Right',
        right: {
          message: 'Experiment completed',
          values: [
            {
              experimentId,
              researchTag,
              profileName,
            },
          ],
        },
      });

      expect(differenceInMilliseconds(end, start)).toBeGreaterThan(
        (1.5 + 1) * 2 * 100
      );
    });

    test('succeed when experimentId has valid "search" directives and `publicKey` and `secretKey` keys', async () => {
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
        opts: {
          publicKey: publicKey as any,
          secretKey: secretKey as any,
        },
      })();

      expect(result).toMatchObject({
        _tag: 'Right',
        right: {
          message: 'Experiment completed',
          values: [
            {
              publicKey,
            },
          ],
        },
      });
    });
  });
});
