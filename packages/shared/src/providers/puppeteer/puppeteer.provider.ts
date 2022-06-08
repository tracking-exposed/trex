import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import type * as puppeteer from 'puppeteer-core';
import { PuppeteerExtra } from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { AppError, toAppError } from '../../errors/AppError';
import { Logger } from '../../logger';
import {
  CustomDirective,
  CustomDirectiveType,
  Directive,
  ScrollForDirective,
  ScrollForDirectiveType,
} from '../../models/Directive';
// import { throwTE } from '../../utils/task.utils';
import { DirectiveHooks } from './DirectiveHook';
import { openURL } from './directives/openURL';
import { GetScrollFor } from './directives/scroll';

export type LaunchOptions = puppeteer.LaunchOptions &
  puppeteer.BrowserLaunchArgumentOptions &
  puppeteer.BrowserConnectOptions & {
    product?: puppeteer.Product;
    extraPrefsFirefox?: Record<string, unknown>;
  };

interface PuppeteerProviderContext {
  logger: Logger;
  config: {
    loadFor: number;
  };
  puppeteer: PuppeteerExtra;
  hooks: DirectiveHooks<string, any>;
}

export const launch =
  (ctx: PuppeteerProviderContext) =>
  (opts: LaunchOptions): TE.TaskEither<AppError, puppeteer.Browser> => {
    return TE.tryCatch(async () => {
      ctx.logger.info('Launch puppeteer %O', opts);
      ctx.puppeteer.use(StealthPlugin());
      const browser = await ctx.puppeteer.launch(opts as any);

      return browser as any;
    }, toAppError);
  };

/**
 * automate directive execution for browser page
 */
const operateTab =
  (ctx: PuppeteerProviderContext) =>
  (page: puppeteer.Page, h: Directive): TE.TaskEither<AppError, any> => {
    if (ScrollForDirective.is(h) || CustomDirective.is(h)) {
      switch (h.type) {
        case ScrollForDirectiveType.value: {
          return GetScrollFor(ctx)(page, h);
        }
        case CustomDirectiveType.value:
          return TE.tryCatch(() => {
            ctx.logger.debug('Custom handler %s', h.handler);
            const handler = ctx.hooks.customs?.[h.handler];
            if (handler) {
              ctx.logger.debug('Handler found');
              try {
                return handler(page, h);
              } catch (e) {
                ctx.logger.error(`Error in custom handler %s`, h.handler);
              }
            }
            return Promise.resolve(undefined);
          }, toAppError);
        default:
          return TE.right(undefined);
      }
    }

    return openURL(ctx)(page, h, {
      loadFor: ctx.config.loadFor,
    });
  };

export const operateBrowser =
  (ctx: PuppeteerProviderContext) =>
  (
    page: puppeteer.Page,
    directives: Directive[]
  ): TE.TaskEither<AppError, string> => {
    return pipe(
      TE.tryCatch(
        () => ctx.hooks.openURL.beforeDirectives(page),
        (e) => new AppError('BeforeDirectivesError', (e as any).message, [])
      ),
      TE.chain(() =>
        TE.sequenceSeqArray(directives.map((d) => operateTab(ctx)(page, d)))
      ),
      TE.chainFirst(() =>
        TE.tryCatch(
          () => ctx.hooks.openURL.completed(),
          (e) => new AppError('Completed', (e as any).message, [])
        )
      ),
      TE.chainFirst(() =>
        TE.tryCatch(async () => {
          if (ctx.config.loadFor < 20000) {
            ctx.logger.debug('Wait for timeout %d', 15000);
            await page.waitForTimeout(15000);
          }
          return undefined;
        }, toAppError)
      ),
      TE.map((results) => {
        ctx.logger.debug(`Operate browser results %O`, results);
        return results[0];
      })
    );
  };

export interface PuppeteerProvider {
  launch: (opts: LaunchOptions) => TE.TaskEither<AppError, puppeteer.Browser>;
  operateTab: (
    page: puppeteer.Page,
    directive: Directive
  ) => TE.TaskEither<AppError, any>;
  operateBrowser: (
    page: puppeteer.Page,
    directive: Directive[]
  ) => TE.TaskEither<AppError, string>;
}

export type GetPuppeteer = (ctx: PuppeteerProviderContext) => PuppeteerProvider;

export const GetPuppeteer: GetPuppeteer = (ctx) => {
  return {
    launch: launch(ctx),
    operateBrowser: operateBrowser(ctx),
    operateTab: operateTab(ctx),
  };
};
