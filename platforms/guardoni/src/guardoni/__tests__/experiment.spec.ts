import { CommonStepArb } from '@shared/arbitraries/Step.arb';
import { toAppError } from '@shared/errors/AppError';
import { toClickCommand } from '@shared/providers/puppeteer/steps/click';
import { toKeypressCommand } from '@shared/providers/puppeteer/steps/keyPress';
import { fc } from '@shared/test';
import { csvStringifyTE } from '@shared/utils/csv.utils';
import { throwTE } from '@shared/utils/task.utils';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/TaskEither';
import { GetTests, Tests } from '../../../test/index';
import { parseExperimentCSV, walkPaginatedRequest } from '../experiment';

describe('experiment.ts', () => {
  let tests: Tests;

  beforeAll(async () => {
    tests = GetTests();
  });

  describe('parseExperimentCSV', () => {
    test('succeeds with "-" delimiter for "onCompleted" column', async () => {
      const keypressCommand = toKeypressCommand('ArrowDown', 5, 1000);
      const clickCommand = toClickCommand('video');

      const steps = tests.fc.sample(CommonStepArb, 2).map((s, i) => ({
        ...s,
        onCompleted:
          i % 2 == 0
            ? `${keypressCommand} - ${clickCommand}`
            : `${keypressCommand}-${clickCommand}`,
      }));

      const experimentCSVContent = await throwTE(
        csvStringifyTE(steps, {
          header: true,
          encoding: 'utf-8',
        })
      );

      const result = await pipe(
        parseExperimentCSV(tests.logger)(experimentCSVContent),
        throwTE
      );

      expect(result).toMatchObject([
        {
          type: 'openURL',
        },
        {
          type: 'keypress',
          key: 'ArrowDown',
          times: 5,
          delay: 1000,
        },
        {
          type: 'click',
          selector: 'video',
        },
        {
          type: 'openURL',
        },
        {
          type: 'keypress',
          key: 'ArrowDown',
          times: 5,
          delay: 1000,
        },
        {
          type: 'click',
          selector: 'video',
          delay: 0,
        },
      ]);
    });

    test('succeeds with "–" delimiter for "onCompleted" column', async () => {
      const keypressCommand = toKeypressCommand('ArrowDown', 5, 1000);
      const clickCommand = toClickCommand('video');

      const steps = tests.fc.sample(CommonStepArb, 2).map((s) => ({
        ...s,
        onCompleted: `${keypressCommand} – ${clickCommand}`,
      }));

      const experimentCSVContent = await throwTE(
        csvStringifyTE(steps, {
          header: true,
          encoding: 'utf-8',
        })
      );

      const result = await pipe(
        parseExperimentCSV(tests.logger)(experimentCSVContent),
        throwTE
      );

      expect(result).toMatchObject([
        {
          type: 'openURL',
        },
        {
          type: 'keypress',
          key: 'ArrowDown',
          times: 5,
          delay: 1000,
        },
        {
          type: 'click',
          selector: 'video',
        },
        {
          type: 'openURL',
        },
        {
          type: 'keypress',
          key: 'ArrowDown',
          times: 5,
          delay: 1000,
        },
        {
          type: 'click',
          selector: 'video',
          delay: 0,
        },
      ]);
    });
  });

  describe('walkPaginatedRequest', () => {
    test('succeeds after 2 loop', async () => {
      const firstPage = fc.sample(fc.anything(), 10);
      const secondPage = fc.sample(fc.anything(), 10);
      const paginatedRequest = jest
        .fn()
        .mockResolvedValueOnce({
          data: firstPage,
          total: 20,
        })
        .mockResolvedValueOnce({
          data: secondPage,
          total: 20,
        });
      const data = [...firstPage, ...secondPage];

      const result = await throwTE(
        walkPaginatedRequest(tests.logger)(
          () =>
            TE.tryCatch(
              () => paginatedRequest() as any as Promise<any>,
              toAppError
            ),
          (r) => r.total,
          (r) => r.data,
          0,
          10
        )
      );

      expect(result.length).toBe(20);
      expect(result).toMatchObject(data);
    });

    test('succeeds after 3 loop', async () => {
      const firstPage = fc.sample(fc.anything(), 10);
      const secondPage = fc.sample(fc.anything(), 10);
      const thirdPage = fc.sample(fc.anything(), 5);
      const paginatedRequest = jest
        .fn()
        .mockResolvedValueOnce({
          data: firstPage,
          total: 25,
        })
        .mockResolvedValueOnce({
          data: secondPage,
          total: 25,
        })
        .mockResolvedValueOnce({
          data: thirdPage,
          total: 25,
        });
      const data = [...firstPage, ...secondPage, ...thirdPage];

      const result = await throwTE(
        walkPaginatedRequest(tests.logger)(
          () =>
            TE.tryCatch(
              () => paginatedRequest() as any as Promise<any>,
              toAppError
            ),
          (r) => r.total,
          (r) => r.data,
          0,
          10
        )
      );

      expect(result.length).toBe(25);
      expect(result).toMatchObject(data);
    });
  });
});
