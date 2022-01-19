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
import { GetGuardoni } from '../guardoni';

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

const writeCSVFile = (p: fs.PathLike, content: any[]): void => {
  const keys = Object.keys(content[0]);
  const commaSeparatedString = [
    keys.join(','),
    content
      .map((row) => keys.map((key) => `"${row[key]}"`).join(','))
      .join('\n'),
  ].join('\n');
  fs.writeFileSync(p, commaSeparatedString, 'utf-8');
};
const basePath = path.resolve(__dirname, '../../../');
const profileName = 'test-profile';
const extensionDir = path.resolve(__dirname, '../../../build/extension');

describe('Guardoni', () => {
  let experimentId: string;
  const guardoni = GetGuardoni({
    headless: false,
    verbose: false,
    basePath,
    profile: profileName,
    extensionDir,
    backend: 'http://localhost:9009/api',
  });

  beforeAll(() => {
    fs.mkdirSync(path.resolve(basePath, 'experiments'), {
      recursive: true,
    });

    writeCSVFile(
      path.resolve(basePath, 'experiments/experiment-comparison.csv'),
      tests.fc.sample(ComparisonDirectiveRowArb, 10)
    );

    writeCSVFile(
      path.resolve(basePath, 'experiments/experiment-chiaroscuro.csv'),
      tests.fc.sample(ChiaroScuroDirectiveRowArb, 10)
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
        guardoni
          .cli({
            run: 'register-csv',
            file: './fake-file',
            type: 'chiaroscuro',
          })
          .run()
      ).resolves.toMatchObject({
        _tag: 'Left',
        left: {
          message: 'Failed to read csv file ./fake-file',
        },
      });
    });

    test('fails when csv file is incompatible with type "chiaroscuro"', async () => {
      await expect(
        guardoni
          .cli({
            run: 'register-csv',
            file: './experiments/experiment-comparison.csv' as any,
            type: 'chiaroscuro',
          })
          .run()
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
        guardoni
          .cli({
            run: 'register-csv',
            file: './experiments/experiment-chiaroscuro.csv' as any,
            type: 'comparison',
          })
          .run()
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

      const result: any = await guardoni
        .cli({
          run: 'register-csv',
          type: 'comparison',
          file: './experiments/experiment-comparison.csv',
        })
        .run();

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

      const result: any = await guardoni
        .cli({
          run: 'register-csv',
          type: 'comparison',
          file: './experiments/experiment-comparison.csv',
        })
        .run();

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

      const result: any = await guardoni
        .cli({
          run: 'register-csv',
          type: 'comparison',
          file: './experiments/experiment-comparison.csv',
        })
        .run();

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

      const result: any = await guardoni
        .cli({
          run: 'register-csv',
          type: 'chiaroscuro',
          file: './experiments/experiment-chiaroscuro.csv',
        })
        .run();

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
        guardoni.cli({ run: 'experiment', experiment: '' }).run()
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

      const result: any = await guardoni
        .cli({ run: 'experiment', experiment: experimentId })
        .run();

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

      const result: any = await guardoni
        .cli({ run: 'experiment', experiment: experimentId })
        .run();

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

      const result: any = await guardoni
        .cli({ run: 'experiment', experiment: experimentId })
        .run();

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

      const result: any = await guardoni.cli({ run: 'auto', value: '1' }).run();

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

      const result: any = await guardoni.cli({ run: 'auto', value: '2' }).run();

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

  describe('Public Methods', () => {
    test('run experiment fails when proxy is wrong', async () => {
      axiosMock.request.mockResolvedValueOnce({
        data: tests.fc.sample(ComparisonDirectiveArb, 2),
      });

      const result = await GetGuardoni({
        headless: false,
        verbose: true,
        basePath,
        extensionDir,
        proxy: 'fake://10.0.0.0',
      }).runExperiment('experiment-id' as any)();

      expect(result).toMatchObject({
        left: {
          name: 'ProxyError',
          message: 'Error, --proxy must start with socks5://',
          details: [],
        },
      });
    });

    test("run experiment succeeds with correct directive 'comparison' type", async () => {
      axiosMock.request.mockResolvedValueOnce({
        data: tests.fc.sample(ComparisonDirectiveArb, 2),
      });

      axiosMock.request.mockResolvedValueOnce({
        data: {
          acknowledged: true,
        },
      });

      const result = await guardoni.runExperiment('experiment-id' as any)();

      expect(result).toMatchObject({
        right: {
          values: {
            directiveType: 'comparison',
          },
        },
      });
    });

    test("run experiment succeeds with correct directive 'chiaroscuro' type", async () => {
      axiosMock.request.mockResolvedValueOnce({
        data: tests.fc.sample(ChiaroScuroDirectiveArb, 2),
      });

      axiosMock.request.mockResolvedValueOnce({
        data: {
          acknowledged: true,
        },
      });

      const result = await guardoni.runExperiment('experiment-id' as any)();

      expect(result).toMatchObject({
        right: {
          values: {
            directiveType: 'chiaroscuro',
          },
        },
      });
    });
  });
});
