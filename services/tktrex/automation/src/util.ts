import Crypto from 'crypto';

import fs from 'fs';

import { cp, mkdir, stat } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import readline from 'readline';

import * as TE from 'fp-ts/lib/TaskEither';

export type TEString = TE.TaskEither<Error, string>;

export const toError = (e: unknown): Error => {
  if (e instanceof Error) {
    return e;
  }
  return new Error('unspecified error');
};

export const prompt = async(
  message: string,
  a?: AbortSignal,
): Promise<string> =>
  new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    if (a) {
      const onAbort = (): void => {
        a.removeEventListener('abort', onAbort);
        rl.close();
        reject(new Error('aborted'));
      };

      a.addEventListener('abort', onAbort);
    }

    rl.question(message, (answer) => {
      rl.close();
      return resolve(answer);
    });
  });

export const sleep = async(ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const tmpDir = async(prefix?: string): Promise<string> => {
  const dir = tmpdir();
  const name = prefix
    ? `${prefix}-${Crypto.randomBytes(8).toString('hex')}`
    : '';
  const path = join(dir, name);
  await mkdir(path);
  return path;
};

/**
 * Create a function that returns a function accepting a map of
 * source file names to destination file names that will copy
 * the source files from {fromDirectory} to {toDirectory}.
 *
 * E.g.:
 *
 * const from = 'src';
 * const to = 'dist';
 *
 * await makeCopyFromTo(from, to)({
 *  'foo.js': 'bar.js',
 *  'baz.js': 'qux.js',
 * });
 *
 * Will copy:
 * - src/foo.js to dist/bar.js
 * - src/baz.js to dist/qux.js
 */
export const copyFromTo =
  (fromDirectory: string, toDirectory: string) =>
    async(map: Record<string, string>): Promise<void> => {
      await Promise.all(
        Object.entries(map).map(([from, to]) =>
          cp(join(fromDirectory, from), join(toDirectory, to)),
        ),
      );
    };

/**
 * Escape a string for use in a shell command.
 */
export const shellEscape = (cmd: string): string =>
  cmd.replace(/(["'$`\\]|\s+)/g, '\\$1');

export const fileExists = async(path: string): Promise<boolean> => {
  try {
    await stat(path);
    return true;
  } catch (e) {
    return false;
  }
};

export const isEmptyDirectoryOrDoesNotExist = async(
  path: string,
): Promise<true | 'not-a-directory' | 'directory-not-empty'> => {
  try {
    const stats = await stat(path);

    if (!stats.isDirectory()) {
      return 'not-a-directory';
    }

    const entries = await fs.promises.readdir(path);

    if (entries.length > 0) {
      return 'directory-not-empty';
    }

    return true;
  } catch (e) {
    return true;
  }
};
