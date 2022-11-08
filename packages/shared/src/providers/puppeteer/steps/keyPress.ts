import * as A from 'fp-ts/lib/Array';
import * as E from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';
import * as T from 'fp-ts/lib/Task';
import * as TE from 'fp-ts/lib/TaskEither';
import * as puppeteer from 'puppeteer-core';
import { AppError, toAppError } from '../../../errors/AppError';
import { KeypressStep } from '../../../models/Step';
import { sleep } from '../../../utils/promise.utils';
import { StepContext } from './types';

export const KEYPRESS_COMMAND_REGEXP = /keypress\((\w+);(\d+);(\d+)\)/;

export const toKeypressCommand = (
  key: string,
  count: number,
  interval: number
): string => `keypress(${key};${count};${interval})`;

export const parseKeypressCommand = (
  cmd: string
): E.Either<AppError, { key: puppeteer.KeyInput; times: number }> => {
  const match = KEYPRESS_COMMAND_REGEXP.exec(cmd);
  // console.log(match);
  if (match?.[1] && match[2]) {
    const key: any = match[1];
    const times = parseInt(match[2], 10);
    const delay = parseInt(match[3], 10);
    return E.right({ key, times, delay });
  }
  return E.left(toAppError(new Error(`Cannot parse command: ${cmd}`)));
};
/**
 * Step with type `scroll`
 *
 * Scroll page with an increment of `incrementScrollBy` until it reaches `totalScroll`
 *
 */

export const GetKeypressStep =
  (ctx: StepContext) =>
  (
    page: puppeteer.Page,
    { times, key, delay: _delay, ...opts }: KeypressStep
  ): TE.TaskEither<AppError, void> => {
    const delay = _delay ?? 0;

    return pipe(
      A.sequence(T.ApplicativeSeq)(
        Array.from({ length: times === undefined ? 1 : times }).map(
          (_, i): T.Task<void> =>
            () =>
              sleep(delay)
                .then(() => page.keyboard.press(key, opts))
                .then((r) => {
                  ctx.logger.debug('Key %s pressed for the %d times', key, i);
                  return undefined;
                })
        )
      ),
      TE.fromTask,
      TE.mapLeft(toAppError),
      TE.map(() => undefined)
    );
  };
