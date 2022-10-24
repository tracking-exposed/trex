import * as E from 'fp-ts/lib/Either';
import * as TE from 'fp-ts/lib/TaskEither';
import * as puppeteer from 'puppeteer-core';
import { AppError, toAppError } from '../../../errors/AppError';
import { ClickStep } from '../../../models/Step';
import { sleep } from '../../../utils/promise.utils';
import { StepContext } from './types';

/**
 * Click command REgExp
 *
 * click('video')
 */
export const CLICK_COMMAND_REGEXP =
  // eslint-disable-next-line no-useless-escape
  /click\(([#|\.]?[\w|:|\s|\.|\-]+);(\d+)\)/;

export const toClickCommand = (selector: string, delay?: number): string =>
  `click(${selector};${delay ?? 0})`;
  
export const parseClickCommand = (
  cmd: string
): E.Either<AppError, { selector: string; delay: number }> => {
  const match = CLICK_COMMAND_REGEXP.exec(cmd);
  // console.log('click match?', { cmd, match });
  if (match?.[1] && match[2]) {
    const selector: any = match[1];
    const delay = parseInt(match[2], 10);
    return E.right({ selector, delay });
  }

  return E.left(
    new AppError('ClickStepError', `Cannot parse command: ${cmd}`, [])
  );
};
/**
 * Click step
 *
 * Click an element by the given selector
 *
 */

export const GetClickStep =
  (ctx: StepContext) =>
  (
    page: puppeteer.Page,
    { selector, delay: _delay }: ClickStep
  ): TE.TaskEither<AppError, void> => {
    const delay = _delay ?? 0;

    return TE.tryCatch(async () => {
      ctx.logger.debug('Click %s with delay %d', selector, delay);
      const el = await page.waitForSelector(selector, { timeout: 0 });
      await el?.click();
      await sleep(2000);
    }, toAppError);
  };
