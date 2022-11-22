import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import type * as puppeteer from 'puppeteer-core';
import { AppError, toAppError } from '../../../errors/AppError';
import { Logger } from '../../../logger';
import { OpenURLStep } from '../../../models/Step';
import { StepHooks } from '../StepHooks';

interface OpenURLContext {
  logger: Logger;
  hooks: StepHooks<string, any>;
}

interface OpenURLOptions {
  loadFor: number;
}

/**
 * Step with type `openURL`
 *
 * This is the default step, which navigates to the given url and
 * performs some domain specific hooks.
 *
 */

export const openURL =
  (ctx: OpenURLContext) =>
  (
    page: puppeteer.Page,
    step: OpenURLStep,
    opts: OpenURLOptions
  ): TE.TaskEither<AppError, string> => {
    return TE.tryCatch(async () => {
      try {
        await ctx.hooks.openURL.beforeLoad(page, step);
        // await throwTE(runHooks(ctx)(page, step, 'beforeLoad'));
      } catch (error) {
        ctx.logger.debug(
          'error in beforeLoad %s %s step %o',
          (error as any).message,
          (error as any).stack,
          step
        );
      }

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
      const loadFor = step.loadFor ?? opts.loadFor ?? 6000;

      ctx.logger.info('— Loading %s (for %d ms)', step?.url, loadFor);
      // Remind you can exclude step with env/--exclude=urltag

      // TODO the 'timeout' would allow to repeat this operation with
      // different parameters. https://stackoverflow.com/questions/60051954/puppeteer-timeouterror-navigation-timeout-of-30000-ms-exceeded
      try {
        await page.goto(step.url, {
          waitUntil: 'domcontentloaded',
          timeout: 20000,
        });
      } catch (e) {
        ctx.logger.error('Error during goto %O (domcontentloaded)', e);

        try {
          ctx.logger.debug('Try to reach %s without timeout', step.url);
          await page.goto(step.url, {
            timeout: 0,
          });
        } catch (e) {
          ctx.logger.error('Error during goto %O', e);
          throw e;
        }
      }

      try {
        await ctx.hooks.openURL.beforeWait(page, step);
      } catch (error) {
        ctx.logger.error(
          'error in beforeWait %s (%s)',
          (error as any).message,
          (error as any).stack
        );
      }

      ctx.logger.info(
        'Step to URL %s, Loading delay %d (--load optional)',
        step.url,
        loadFor
      );

      await page.waitForTimeout(
        typeof loadFor === 'string' ? parseInt(loadFor) : loadFor
      );

      try {
        // debugger;
        await ctx.hooks.openURL.afterWait(page, step);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log(
          'Error in afterWait',
          (error as any).message,
          (error as any).stack
        );
      }
      ctx.logger.info('— Completed %O \n', step);
      // run the "onCompleted" hook for `openURL` step;
      return pipe(
        TE.tryCatch(async () => {
          const result = await ctx.hooks.openURL.completed(page, step);
          ctx.logger.debug('Completed! %O', result);
          return result;
        }, toAppError)
      )().then((r) => {
        if (r._tag === 'Left') {
          return Promise.reject(r.left);
        }
        return r.right;
      });
    }, toAppError);
  };
