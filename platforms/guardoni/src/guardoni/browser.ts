import { AppError, toAppError } from '@shared/errors/AppError';
import { Directive } from '@shared/models/Directive';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import type * as puppeteer from 'puppeteer-core';
import domainSpecific from './domainSpecific';
import { GuardoniContext } from './types';

export const dispatchBrowser = (
  ctx: GuardoniContext
): TE.TaskEither<AppError, puppeteer.Browser> => {
  const execCount = ctx.profile.execount;
  const proxy = ctx.platform.proxy;

  const commandLineArg = [
    '--no-sandbox',
    '--disabled-setuid-sandbox',
    '--load-extension=' + ctx.platform.extensionDir,
    '--disable-extensions-except=' + ctx.platform.extensionDir,
  ];

  if (proxy) {
    if (!proxy.startsWith('socks5://')) {
      return TE.left(
        new AppError(
          'ProxyError',
          'Error, --proxy must start with socks5://',
          []
        )
      );
    }
    commandLineArg.push('--proxy-server=' + proxy);
    ctx.logger.debug(
      'Dispatching browser: profile usage count %d proxy %s',
      execCount,
      proxy
    );
  } else {
    ctx.logger.debug(
      'Dispatching browser: profile usage count %d, with NO PROXY',
      execCount
    );
  }
  return TE.tryCatch(async () => {
    // puppeteer.use(pluginStealth());
    const browser = await ctx.puppeteer.launch({
      headless: ctx.config.headless,
      userDataDir: ctx.profile.udd,
      executablePath: ctx.config.chromePath,
      args: commandLineArg,
    });

    return browser;
  }, toAppError);
};

/**
 * automate directive execution for browser page
 */
const operateTab =
  (ctx: GuardoniContext) =>
  (
    page: puppeteer.Page,
    directive: Directive
  ): TE.TaskEither<AppError, void> => {
    return TE.tryCatch(async () => {
      try {
        await domainSpecific.beforeLoad(page, ctx.profile);
      } catch (error) {
        ctx.logger.debug(
          'error in beforeLoad %s %s directive %o',
          (error as any).message,
          (error as any).stack,
          directive
        );
      }

      const loadFor = (directive as any).loadFor ?? ctx.config.loadFor ?? 6000;

      ctx.logger.info(
        '— Loading %s (for %d ms) %O',
        (directive as any).url,
        loadFor,
        directive
      );
      // Remind you can exclude directive with env/--exclude=urltag

      // TODO the 'timeout' would allow to repeat this operation with
      // different parameters. https://stackoverflow.com/questions/60051954/puppeteer-timeouterror-navigation-timeout-of-30000-ms-exceeded
      await page.goto((directive as any).url, {
        waitUntil: 'networkidle0',
      });

      try {
        await domainSpecific.beforeWait(page, ctx.profile);
      } catch (error) {
        ctx.logger.error(
          'error in beforeWait %s (%s)',
          (error as any).message,
          (error as any).stack
        );
      }

      ctx.logger.info(
        'Directive to URL %s, Loading delay %d (--load optional)',
        (directive as any).url,
        loadFor
      );
      await page.waitForTimeout(loadFor);

      try {
        // debugger;
        await domainSpecific.afterWait(page, directive);
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

export const operateBrowser =
  (ctx: GuardoniContext) =>
  (
    page: puppeteer.Page,
    directives: Directive[]
  ): TE.TaskEither<AppError, void> => {
    return pipe(
      TE.sequenceSeqArray(directives.map((d) => operateTab(ctx)(page, d))),
      TE.chain(() =>
        TE.tryCatch(async () => {
          if (ctx.config.loadFor < 20000) {
            await page.waitForTimeout(15000);
          }
          return undefined;
        }, toAppError)
      )
    );
  };
