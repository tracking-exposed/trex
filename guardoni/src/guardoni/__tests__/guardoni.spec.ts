/* eslint-disable import/first */
jest.mock('axios');
jest.mock('puppeteer-core');
import {
  ChiaroScuroDirectiveArb,
  ChiaroScuroDirectiveRowArb,
  ComparisonDirectiveRowArb,
  PostDirectiveSuccessResponseArb,
} from '@shared/arbitraries/Directive.arb';
import * as tests from '@shared/test';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as puppeteer from 'puppeteer-core';
import { GetGuardoni } from '../guardoniV2';

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

describe('Guardoni', () => {
  let experimentId: string;
  const guardoni = GetGuardoni({
    headless: false,
    verbose: false,
    basePath,
    profile: 'test-profile',
    extensionDir: path.resolve(__dirname, '../../../build/extension'),
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

  describe('Register an experiment', () => {
    test('fails when the file path is wrong', async () => {
      // mocks

      await expect(
        guardoni
          .cli({
            run: 'register',
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
            run: 'register',
            file: './experiments/experiment-comparison.csv',
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
            run: 'register',
            file: './experiments/experiment-chiaroscuro.csv',
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

    test('success with type comparison and proper csv file', async () => {
      // return experiment
      axiosMock.request.mockResolvedValueOnce({
        data: tests.fc.sample(PostDirectiveSuccessResponseArb, 1)[0],
      });

      const result: any = await guardoni
        .cli({
          run: 'register',
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

    test('succeed when experimentId is valid', async () => {
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
  });
});
