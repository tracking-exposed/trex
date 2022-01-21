/* eslint-disable import/first */
jest.mock('axios');
jest.mock('puppeteer-core');
import {
  ChiaroScuroDirectiveArb,
  ChiaroScuroDirectiveRowArb,
  ComparisonDirectiveArb,
  ComparisonDirectiveRowArb,
  PostDirectiveSuccessResponseArb,
} from '@shared/arbitraries/Directive.arb';
import * as tests from '@shared/test';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as puppeteer from 'puppeteer-core';
import { GetGuardoniCLI } from '../cli';
import { csvStringifyTE } from '../utils';

const axiosMock = axios as jest.Mocked<typeof axios>;
axiosMock.create.mockImplementation(() => axiosMock);

const puppeteerMock = puppeteer as jest.Mocked<typeof puppeteer>;
const pageMock = {
  on: jest.fn(),
  goto: jest.fn(),
  waitForTimeout: jest.fn(),
};
const browserMock = {
  pages: jest.fn().mockResolvedValue([pageMock] as any),
};
puppeteerMock.launch.mockResolvedValue(browserMock as any);

const basePath = path.resolve(__dirname, '../../../');
const profileName = 'test-profile';
const extensionDir = path.resolve(__dirname, '../../../build/extension');

describe('CLI', () => {
  let experimentId: string;
  const guardoni = GetGuardoniCLI({
    headless: false,
    verbose: false,
    basePath,
    profileName: profileName,
    extensionDir,
    backend: 'http://localhost:9009/api',
    loadFor: 3000,
    evidenceTag: 'test-tag',
    chromePath: '/chrome/fake/path',
  });

  beforeAll(async () => {
    fs.mkdirSync(path.resolve(basePath, 'experiments'), {
      recursive: true,
    });

    const comparisonCSVContent = await csvStringifyTE(
      tests.fc.sample(ComparisonDirectiveRowArb, 10),
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

  describe('Register an experiment', () => {
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

      experimentId = result.right.values.experimentId;
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

      experimentId = result.right.values.experimentId;
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

      experimentId = result.right.values.experimentId;
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
      // return directive
      axiosMock.request.mockResolvedValueOnce({
        data: tests.fc.sample(ChiaroScuroDirectiveArb, 2),
      });

      axiosMock.request.mockResolvedValueOnce({
        data: {
          acknowledged: false,
        },
      });

      const result: any = await guardoni.run({
        run: 'experiment',
        experiment: experimentId as any,
      })();

      expect(result).toMatchObject({
        _tag: 'Left',
        left: {
          message: "Can't conclude the experiment",
          details: [],
        },
      });
    });

    test('succeed when experimentId has valid "chiaroscuro" directives', async () => {
      // return directive
      axiosMock.request.mockResolvedValueOnce({
        data: tests.fc.sample(ChiaroScuroDirectiveArb, 2),
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
          values: {},
        },
      });
    });

    test('succeed when experimentId has valid "comparison" directives', async () => {
      // return directive
      axiosMock.request.mockResolvedValueOnce({
        data: tests.fc.sample(ComparisonDirectiveArb, 2),
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
          values: {},
        },
      });
    });
  });

  describe('auto', () => {
    test('succeed when value is "1"', async () => {
      // return directive
      axiosMock.request.mockResolvedValueOnce({
        data: tests.fc.sample(ChiaroScuroDirectiveArb, 2),
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
          values: {},
        },
      });
    });

    test('succeed when value is "2"', async () => {
      // return directive
      axiosMock.request.mockResolvedValueOnce({
        data: tests.fc.sample(ComparisonDirectiveArb, 10),
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
          values: {
            directiveType: 'comparison',
          },
        },
      });
    });
  });
});
