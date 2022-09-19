import { AppError, toAppError } from '@shared/errors/AppError';
import axios from 'axios';
import boxen from 'boxen';
import chalk from 'chalk';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import * as fs from 'fs';
import path from 'path';
import { addHours, parseISO } from 'date-fns';

const DEFAULT_HOURS_TO_NEXT_CHECK = 6;
const NEXT_UPDATE_CHECK_FILE = 'update-check.json';

const checkNextUpdateCheckJSON = (p: string): boolean => {
  if (fs.existsSync(p)) {
    const lastUpdateCheck = pipe(fs.readFileSync(p, 'utf-8'), JSON.parse);

    if (lastUpdateCheck?.date) {
      const now = new Date();

      return now > parseISO(lastUpdateCheck.date);
    }
  }
  return true;
};

const updateNextUpdateCheckJSON = (p: string, d: Date): void => {
  fs.writeFileSync(p, JSON.stringify({ date: d.toISOString() }));
};

export const LATEST_RELEASE_URL =
  'https://github.com/tracking-exposed/trex/releases/latest';

export const checkUpdate = (
  version: string,
  basePath: string
): TE.TaskEither<AppError, void> => {
  const lastUpdateCheckFilePath = path.resolve(
    basePath,
    NEXT_UPDATE_CHECK_FILE
  );

  if (!checkNextUpdateCheckJSON(lastUpdateCheckFilePath)) {
    return TE.right(undefined);
  }

  const fetchLastReleaseTask = TE.tryCatch(
    () =>
      axios.get(LATEST_RELEASE_URL, { maxRedirects: 1, responseType: 'text' }),
    toAppError
  );

  return pipe(
    fetchLastReleaseTask,
    TE.map((r) => {
      // get response url after redirect, that contains vX.X.X
      const lastVersionUrl = r.request?.res.responseUrl;
      if (lastVersionUrl) {
        const lastVersion = lastVersionUrl
          .split('/')
          .reverse()[0]
          .replace('v', '');

        if (lastVersion !== version) {
          const lastVersionChunks = lastVersion.split('.');
          const currentVersionChunks = version.split('.');

          const color =
            // use chalk.red when major is different
            lastVersionChunks[0] !== currentVersionChunks[0]
              ? chalk.red
              : // use chalk.yellow when minor is different
              lastVersionChunks[1] !== currentVersionChunks[1]
              ? chalk.yellow
              : // use chalk.green when patch is different
              lastVersionChunks[2] !== currentVersionChunks[2]
              ? chalk.green
              : // use chalk.red in other cases is different
                chalk.red;

          // eslint-disable-next-line
          console.log(
            boxen(
              `${chalk.green('New update available!')} ${color(version)} -> ${chalk.green(
                lastVersion
              )} \n ${lastVersionUrl}`,
              {
                textAlignment: 'center',
                padding: 2,
              }
            )
          );
        }
      }
    }),
    TE.map(() =>
      updateNextUpdateCheckJSON(
        lastUpdateCheckFilePath,
        addHours(new Date(), DEFAULT_HOURS_TO_NEXT_CHECK)
      )
    )
  );
};
