import * as E from 'fp-ts/lib/Either';
import * as TE from 'fp-ts/lib/TaskEither';
import * as puppeteer from 'puppeteer-core';
import { AppError, toAppError } from '../../../errors/AppError';
import { TypeStep } from '../../../models/Step';
import { sleep } from '../../../utils/promise.utils';
import { StepContext } from './types';

/**
 * Click command REgExp
 *
 * click('video')
 */
export const TYPE_COMMAND_REGEXP =
  // eslint-disable-next-line no-useless-escape
  /type\(([#|\.]?[\w|:|\s|\.|\-]+);\"([\w|\s|\d]+)\"\)/gm;

export const parseTypeCommand = (
  cmd: string
): E.Either<AppError, { selector: string; text: string; delay: number }> => {
  const match = TYPE_COMMAND_REGEXP.exec(cmd);
  // console.log(match);
  if (match?.[1] && match[2]) {
    const selector: any = match[1];
    const text = match[2];
    const delay = parseInt(match[3], 10);
    return E.right({ selector, text, delay });
  }
  return E.left(
    new AppError('TypeStepError', `Cannot parse command: ${cmd}`, [])
  );
};
/**
 * Type step
 *
 * Type into an element by the given selector
 *
 */

export const GetTypeStep =
  (ctx: StepContext) =>
  (
    page: puppeteer.Page,
    { selector, text, delay: _delay }: TypeStep
  ): TE.TaskEither<AppError, void> => {
    const delay = _delay ?? 0;

    return TE.tryCatch(async () => {
      ctx.logger.debug('Type %s with delay %d', selector, delay);
      await sleep(delay);
      const el = await page.waitForSelector(selector, { timeout: 0 });
      await el?.type(text);
    }, toAppError);
  };
