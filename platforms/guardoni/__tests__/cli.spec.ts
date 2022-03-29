/* eslint-disable import/first */
jest.mock('axios');

import {
  ChiaroScuroDirectiveArb,
  ChiaroScuroDirectiveRowArb,
  ComparisonDirectiveArb,
  ComparisonDirectiveRowArb,
  GuardoniExperimentArb,
  PostDirectiveSuccessResponseArb,
} from '@shared/arbitraries/Directive.arb';
import * as tests from '@shared/test';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { GetGuardoniCLI } from '../src/guardoni/cli';
import { csvStringifyTE } from '../src/guardoni/utils';
import { puppeteerMock } from '../__mocks__/puppeteer.mock';
import differenceInMilliseconds from 'date-fns/differenceInMilliseconds';

const axiosMock = axios as jest.Mocked<typeof axios>;
axiosMock.create.mockImplementation(() => axiosMock);

const basePath = path.resolve(process.cwd(), './');
const profileName = 'profile-test-1';
const extensionDir = path.resolve(__dirname, '../build/extension');

describe('CLI', () => {
  const evidenceTag = 'test-tag';
  let experimentId: string;
  const guardoni = GetGuardoniCLI(
    {
      headless: false,
      verbose: false,
      basePath,
      profileName: profileName,
      extensionDir,
      backend: 'http://localhost:9009/api',
      loadFor: 3000,
      evidenceTag,
      chromePath: '/chrome/fake/path',
    },
    puppeteerMock
  );

  jest.setTimeout(60 * 1000);

  beforeAll(async () => {
    // make extension path
    fs.mkdirSync(extensionDir, { recursive: true })

    fs.mkdirSync(path.resolve(basePath, 'experiments'), {
      recursive: true,
    });

    const comparisonCSVContent = await csvStringifyTE(
      tests.fc.sample(ComparisonDirectiveRowArb, 5),
      { header: true, encoding: 'utf-8' }
    )();

    if (comparisonCSVContent._tag === 'Left') {
      throw comparisonCSVContent.left as any;
    }

    fs.writeFileSync(
      path.resolve(basePath, 'experiments/experiment-comparison.csv'),
      comparisonCSVContent.right,
      'utf-8'
    );

    const chiaroscuroCSVContent = await csvStringifyTE(
      tests.fc.sample(ChiaroScuroDirectiveRowArb, 10),
      { header: true, encoding: 'utf-8' }
    )();

    if (chiaroscuroCSVContent._tag === 'Left') {
      throw chiaroscuroCSVContent.left as any;
    }

    fs.writeFileSync(
      path.resolve(basePath, 'experiments/experiment-chiaroscuro.csv'),
      chiaroscuroCSVContent.right,
      'utf-8'
    );
  });

  afterAll(() => {
    fs.rmdirSync(path.resolve(basePath, 'profiles', profileName), {
      recursive: true,
    });
  });

  describe('Register an experiment from a CSV', () => {
    test('fails when the file path is wrong', async () => {
      // mocks

      await expect(
        guardoni.run({
          run: 'register-csv',
          file: './fake-file' as any,
          type: 'chiaroscuro',
        })()
      ).resolves.toMatchObject({
        _tag: 'Left',
        left: {
          message: `Failed to read csv file ${basePath}/fake-file`,
        },
      });
    });

    test('fails when csv file is incompatible with type "chiaroscuro"', async () => {
      await expect(
        guardoni.run({
          run: 'register-csv',
          file: './experiments/experiment-comparison.csv' as any,
          type: 'chiaroscuro',
        })()
      ).resolves.toMatchObject({
        _tag: 'Left',
        left: {
          name: 'CSVParseError',
          message:
            'The given CSV is not compatible with directive "chiaroscuro"',
        },
      });
    });

    test('fails when csv file is incompatible with type "comparison"', async () => {
      await expect(
        guardoni.run({
          run: 'register-csv',
          file: './experiments/experiment-chiaroscuro.csv' as any,
          type: 'comparison',
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
        type: 'comparison',
        file: './experiments/experiment-comparison.csv' as any,
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
        type: 'comparison',
        file: './experiments/experiment-comparison.csv' as any,
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
        type: 'comparison',
        file: './experiments/experiment-comparison.csv' as any,
      })();

      expect(result).toMatchObject({
        _tag: 'Right',
        right: {
          message: 'Experiment already available',
        },
      });

      experimentId = result.right.values[0].experimentId;
    });

    test('succeeds with type "chiaroscuro" and proper csv file', async () => {
      // return experiment
      axiosMock.request.mockResolvedValueOnce({
        data: {
          ...tests.fc.sample(PostDirectiveSuccessResponseArb, 1)[0],
          status: 'exist',
        },
      });

      const result: any = await guardoni.run({
        run: 'register-csv',
        type: 'chiaroscuro',
        file: './experiments/experiment-chiaroscuro.csv' as any,
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
      // return directives
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
      const directives = tests.fc.sample(GuardoniExperimentArb, 2);
      // return directives
      axiosMock.request.mockResolvedValueOnce({
        data: directives,
      });

      const result: any = await guardoni.run({
        run: 'list',
      })();

      expect(result).toMatchObject({
        _tag: 'Right',
        right: {
          message: 'Experiments List',
          values: directives.map((d) => ({ [d.experimentId]: d })),
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
          message: 'Run experiment validation',
          details: ['Invalid value "" supplied to : NonEmptyString'],
        },
      });
    });

    test('fails when receive an error during experiment conclusion', async () => {
      const data = tests.fc.sample(ChiaroScuroDirectiveArb, 2).map((d) => ({
        ...d,
        loadFor: 1000,
        watchFor: '2s',
      }));

      // return directive
      axiosMock.request.mockResolvedValueOnce({
        data,
      });

      axiosMock.request.mockResolvedValueOnce({
        data: {
          acknowledged: false,
        },
      });

      const start = new Date();
      const result: any = await guardoni.run({
        run: 'experiment',
        experiment: experimentId as any,
      })();
      const end = new Date();

      expect(result).toMatchObject({
        _tag: 'Left',
        left: {
          message: "Can't conclude the experiment",
          details: [],
        },
      });

      expect(differenceInMilliseconds(end, start)).toBeGreaterThan(
        (2 + 3) * 2 * 100
      );
    });

    test('succeed when experimentId has valid "chiaroscuro" directives', async () => {
      // return directive
      axiosMock.request.mockResolvedValueOnce({
        data: tests.fc.sample(ChiaroScuroDirectiveArb, 2).map((d) => ({
          ...d,
          loadFor: 1500,
          watchFor: '1s',
        })),
      });

      axiosMock.request.mockResolvedValueOnce({
        data: {
          acknowledged: true,
        },
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
              directiveType: 'chiaroscuro',
            },
          ],
        },
      });

      expect(differenceInMilliseconds(end, start)).toBeGreaterThan(
        (1.5 + 1) * 2 * 100
      );
    });

    test('succeed when experimentId has valid "comparison" directives', async () => {
      // return directive
      axiosMock.request.mockResolvedValueOnce({
        data: tests.fc.sample(ComparisonDirectiveArb, 2).map((d) => ({
          ...d,
          loadFor: 1000,
          watchFor: '1s',
        })),
      });

      axiosMock.request.mockResolvedValueOnce({
        data: {
          acknowledged: true,
        },
      });

      const result: any = await guardoni.run({
        run: 'experiment',
        experiment: experimentId as any,
      })();

      expect(result).toMatchObject({
        _tag: 'Right',
        right: {
          message: 'Experiment completed',
          values: [
            {
              directiveType: 'comparison',
            },
          ],
        },
      });
    });
  });

  describe('auto', () => {
    test('succeed when value is "1"', async () => {
      // return directive
      axiosMock.request.mockResolvedValueOnce({
        data: tests.fc.sample(ChiaroScuroDirectiveArb, 2).map((d) => ({
          ...d,
          loadFor: 1000,
          watchFor: '1s',
        })),
      });

      axiosMock.request.mockResolvedValueOnce({
        data: {
          acknowledged: true,
        },
      });

      const result: any = await guardoni.run({ run: 'auto', value: '1' })();

      expect(result).toMatchObject({
        _tag: 'Right',
        right: {
          message: 'Experiment completed',
          values: [
            {
              directiveType: 'chiaroscuro',
              evidenceTag: evidenceTag,
            },
          ],
        },
      });
    });

    test('succeed when value is "2"', async () => {
      // return directive
      axiosMock.request.mockResolvedValueOnce({
        data: tests.fc.sample(ComparisonDirectiveArb, 10).map((d) => ({
          ...d,
          watchFor: '1s',
        })),
      });

      axiosMock.request.mockResolvedValueOnce({
        data: {
          acknowledged: true,
        },
      });

      const result: any = await guardoni.run({ run: 'auto', value: '2' })();

      expect(result).toMatchObject({
        _tag: 'Right',
        right: {
          message: 'Experiment completed',
          values: [
            {
              directiveType: 'comparison',
            },
          ],
        },
      });
    });
  });
});
