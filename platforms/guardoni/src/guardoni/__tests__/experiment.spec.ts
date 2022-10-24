import { parseExperimentCSV } from '../experiment';
import { CommonStepArb } from '@shared/arbitraries/Step.arb';
import { throwTE } from '@shared/utils/task.utils';
import { GetTests, Tests } from '../../../test/index';
import { csvStringifyTE } from '@shared/utils/csv.utils';
import { pipe } from 'fp-ts/lib/function';
import { toKeypressCommand } from '@shared/providers/puppeteer/steps/keyPress';
import { toClickCommand } from '@shared/providers/puppeteer/steps/click';

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
});
