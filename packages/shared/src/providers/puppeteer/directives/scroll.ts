import * as TE from 'fp-ts/lib/TaskEither';
import type * as puppeteer from 'puppeteer-core';
import { AppError, toAppError } from '../../../errors/AppError';
import { ScrollForDirective } from '../../../models/Directive';
import { DirectiveContext } from './types';

async function autoScroll(
  page: puppeteer.Page,
  opts: ScrollForDirective
): Promise<void> {
  await page.evaluate(function autoScroll(opts) {
    return new Promise((resolve) => {
      const distance = opts.incrementScrollByPX;

      const timer = setInterval(() => {
        window.scrollBy(0, distance);

        clearInterval(timer);
        resolve(undefined);
      }, opts.interval || 100);
    });
  }, opts as any);
}

export const GetScrollFor =
  (ctx: DirectiveContext) =>
  (
    page: puppeteer.Page,
    directive: ScrollForDirective
  ): TE.TaskEither<AppError, void> => {
    return TE.tryCatch(
      async () =>
        new Promise((resolve, reject) => {
          let i = 0;
          ctx.logger.debug('Start scrolling: %O', directive);
          const timer = setInterval(() => {
            ctx.logger.debug('Running for time %d', i);

            void autoScroll(page, directive).then(() => {
              ctx.logger.debug(
                'Scrolled by %d',
                i * directive.incrementScrollBy
              );

              if (directive.totalScroll < i * directive.incrementScrollByPX) {
                ctx.logger.debug(
                  'Scroll total reached: %d (%d)',
                  i * directive.incrementScrollByPX,
                  directive.totalScroll
                );
                clearInterval(timer);
                resolve(undefined);
              }

              i++;
            });
          }, directive.interval ?? 300);
        }),
      toAppError
    );
  };
