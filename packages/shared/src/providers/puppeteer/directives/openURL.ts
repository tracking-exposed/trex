import * as TE from 'fp-ts/lib/TaskEither';
import type * as puppeteer from 'puppeteer-core';
import { AppError, toAppError } from '../../../errors/AppError';
import { Logger } from '../../../logger';
import { OpenURLDirective } from '../../../models/Directive';
import { DirectiveHooks } from '../DirectiveHook';

interface OpenURLContext {
  logger: Logger;
  hooks: DirectiveHooks<string, any>;
}

interface OpenURLOptions {
  loadFor: number;
}

export const openURL =
  (ctx: OpenURLContext) =>
  (
    page: puppeteer.Page,
    directive: OpenURLDirective,
    opts: OpenURLOptions
  ): TE.TaskEither<AppError, any> => {
    return TE.tryCatch(async () => {
      try {
        await ctx.hooks.openURL.beforeLoad(page, directive);
        // await throwTE(runHooks(ctx)(page, directive, 'beforeLoad'));
      } catch (error) {
        ctx.logger.debug(
          'error in beforeLoad %s %s directive %o',
          (error as any).message,
          (error as any).stack,
          directive
        );
      }

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
      const loadFor = directive.loadFor ?? opts.loadFor ?? 6000;

      ctx.logger.info(
        '— Loading %s (for %d ms) %O',
        directive?.url,
        loadFor,
        directive
      );
      // Remind you can exclude directive with env/--exclude=urltag

      // TODO the 'timeout' would allow to repeat this operation with
      // different parameters. https://stackoverflow.com/questions/60051954/puppeteer-timeouterror-navigation-timeout-of-30000-ms-exceeded
      try {
        await page.goto(directive.url, {
          waitUntil: 'networkidle0',
          timeout: 5000,
        });
      } catch (e) {
        ctx.logger.error('Error during goto %O', e);
        await page.goto(directive.url, {
          waitUntil: ['domcontentloaded'],
          timeout: 5000,
        });
      }

      try {
        await ctx.hooks.openURL.beforeWait(page, directive);
      } catch (error) {
        ctx.logger.error(
          'error in beforeWait %s (%s)',
          (error as any).message,
          (error as any).stack
        );
      }

      ctx.logger.info(
        'Directive to URL %s, Loading delay %d (--load optional)',
        directive.url,
        loadFor
      );

      await page.waitForTimeout(loadFor);

      try {
        // debugger;
        await ctx.hooks.openURL.afterWait(page, directive);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log(
          'Error in afterWait',
          (error as any).message,
          (error as any).stack
        );
      }
      ctx.logger.info('— Completed %O \n', directive);
    }, toAppError);
  };
