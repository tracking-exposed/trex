import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import type * as puppeteer from 'puppeteer-core';
import type { PuppeteerExtra } from 'puppeteer-extra';
import { AppError, toAppError } from '../../errors/AppError';
import { Logger } from '../../logger';
import {
  CustomStepType,
  Step,
  ScrollStepType,
  KeyPressType,
} from '../../models/Step';
// import { throwTE } from '../../utils/task.utils';
import { StepHooks } from './StepHooks';
import { openURL } from './steps/openURL';
import { GetScrollFor } from './steps/scroll';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { GetKeypressStep } from './steps/keyPress';

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
  hooks: StepHooks<string, any>;
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
 * automate step execution for browser page
 */
const operateTab =
  (ctx: PuppeteerProviderContext) =>
  (page: puppeteer.Page, h: Step): TE.TaskEither<AppError, any> => {
    switch (h.type) {
      case ScrollStepType.value: {
        return GetScrollFor(ctx)(page, h);
      }
      case KeyPressType.value: {
        return GetKeypressStep(ctx)(page, h as any);
      }
      case CustomStepType.value:
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
        return openURL(ctx)(page, h, {
          loadFor: ctx.config.loadFor,
        });
    }
  };

export interface OperateResult {
  publicKey: string;
}

export const operateBrowser =
  (ctx: PuppeteerProviderContext) =>
  (
    page: puppeteer.Page,
    steps: Step[]
  ): TE.TaskEither<AppError, OperateResult> => {
    return pipe(
      TE.tryCatch(
        () => ctx.hooks.openURL.beforeDirectives(page),
        (e) => new AppError('BeforeDirectivesError', (e as any).message, [])
      ),
      TE.chain(() =>
        TE.sequenceSeqArray(steps.map((step) => operateTab(ctx)(page, step)))
      ),
      TE.map((results) => results.reduce((acc, o) => ({ ...acc, o }), {})),
      TE.chainFirst(() =>
        TE.tryCatch(async () => {
          if (ctx.config.loadFor < 20000) {
            ctx.logger.debug('Wait for timeout %d', 15000);
            await page.waitForTimeout(15000);
          }
          return undefined;
        }, toAppError)
      )
    );
  };

export interface PuppeteerProvider {
  launch: (opts: LaunchOptions) => TE.TaskEither<AppError, puppeteer.Browser>;
  operateTab: (
    page: puppeteer.Page,
    step: Step
  ) => TE.TaskEither<AppError, any>;
  operateBrowser: (
    page: puppeteer.Page,
    steps: Step[]
  ) => TE.TaskEither<AppError, OperateResult>;
}

export type GetPuppeteer = (ctx: PuppeteerProviderContext) => PuppeteerProvider;

export const GetPuppeteer: GetPuppeteer = (ctx) => {
  return {
    launch: launch(ctx),
    operateBrowser: operateBrowser(ctx),
    operateTab: operateTab(ctx),
  };
};
