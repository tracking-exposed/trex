import { AppError } from '@shared/errors/AppError';
import { LaunchOptions } from '@shared/providers/puppeteer/puppeteer.provider';
import * as TE from 'fp-ts/lib/TaskEither';
import type * as puppeteer from 'puppeteer-core';
import { GuardoniContext } from './types';

export const dispatchBrowser =
  (ctx: GuardoniContext) =>
  (opts: LaunchOptions): TE.TaskEither<AppError, puppeteer.Browser> => {
    const execCount = ctx.profile.execount;
    const proxy = ctx.platform.proxy;

    const commandLineArg = [
      '--no-sandbox',
      '--disabled-setuid-sandbox',
      '--disable-extensions-except=' + ctx.platform.extensionDir,
      '--load-extension=' + ctx.platform.extensionDir,
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

    return ctx.puppeteer.launch({
      headless: ctx.config.headless,
      userDataDir: ctx.profile.udd,
      executablePath: ctx.config.chromePath,
      args: commandLineArg,
      ...opts,
    });
  };
