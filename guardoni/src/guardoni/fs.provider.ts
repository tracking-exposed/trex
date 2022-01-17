import { AppError, toAppError } from '@shared/errors/AppError';
import { toError } from 'fp-ts/lib/Either';
import * as TE from 'fp-ts/lib/TaskEither';
import * as fs from 'fs';

const readFile = (
  a: fs.PathOrFileDescriptor,
  options: BufferEncoding | undefined
): TE.TaskEither<NodeJS.ErrnoException, any> =>
  TE.taskify<
    fs.PathOrFileDescriptor,
    BufferEncoding | undefined,
    NodeJS.ErrnoException,
    any
  >(fs.readFile)(a, options);

export const fsTE = {
  maybeStat: (p: fs.PathLike) =>
    TE.tryCatch(
      () =>
        new Promise((resolve) => {
          fs.stat(p, (err, stat) => {
            if (err) {
              return resolve(undefined);
            }
            resolve(stat);
          });
        }),
      toError
    ),
  statOrFail: TE.taskify<
    fs.PathLike,
    | (fs.StatOptions & {
        bigint?: false | undefined;
      })
    | undefined,
    NodeJS.ErrnoException | null,
    fs.Stats
  >(fs.stat),
  mkdir: TE.taskify<
    fs.PathLike,
    fs.MakeDirectoryOptions & {
      recursive: true;
    },
    NodeJS.ErrnoException | null,
    string
  >(fs.mkdir),
  readFile,
  writeFile: TE.taskify<
    fs.PathOrFileDescriptor,
    string | NodeJS.ArrayBufferView,
    fs.WriteFileOptions,
    NodeJS.ErrnoException,
    undefined
  >(fs.writeFile),
  lift: <T>(
    te: TE.TaskEither<NodeJS.ErrnoException | null, T>
  ): TE.TaskEither<AppError, T> => {
    return TE.mapLeft(toAppError)(te);
  },
};
