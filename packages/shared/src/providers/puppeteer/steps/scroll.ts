import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import type * as puppeteer from 'puppeteer-core';
import { sleep } from '../../../utils/promise.utils';
import { AppError, toAppError } from '../../../errors/AppError';
import { ScrollStep } from '../../../models/Step';
import { StepContext } from './types';

async function autoScroll(
  page: puppeteer.Page,
  opts: ScrollStep
): Promise<void> {
  await page.evaluate(function autoScroll(opts) {
    return new Promise((resolve) => {
      const distance = opts.incrementScrollByPX;

      const timer = setInterval(() => {
        window.scrollBy(0, distance);

        clearInterval(timer);
        resolve(undefined);
      }, opts.interval || 2000);
    });
  }, opts as any);
}

/**
 * Step with type `scroll`
 *
 * Scroll page with an increment of `incrementScrollBy` until it reaches `totalScroll`
 *
 */

export const GetScrollFor =
  (ctx: StepContext) =>
  (page: puppeteer.Page, step: ScrollStep): TE.TaskEither<AppError, void> => {
    return pipe(
      TE.tryCatch(async () => {
        ctx.logger.debug('Start scrolling: %O', step);

        const stepsCount = Math.ceil(
          step.totalScroll / step.incrementScrollByPX
        );

        ctx.logger.debug('Steps count %d', stepsCount);

        for (let i = 0; i <= stepsCount; i++) {
          if (step.totalScroll < i * step.incrementScrollByPX) {
            ctx.logger.debug(
              'Scroll total reached: %d (%d)',
              i * step.incrementScrollByPX,
              step.totalScroll
            );

            return undefined;
          }

          await sleep(step.interval ?? 2000);

          await autoScroll(page, step).then(() => {
            ctx.logger.debug(
              'Scrolled by %d',
              step.incrementScrollByPX + i * step.incrementScrollByPX
            );
          });
        }
      }, toAppError)
    );
  };
