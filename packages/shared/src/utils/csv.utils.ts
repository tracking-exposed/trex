import { AppError, toAppError } from '../errors/AppError';
import csvParse from 'csv-parse';
import * as csvStringify from 'csv-stringify';
import * as TE from 'fp-ts/lib/TaskEither';
import { GetLogger } from '../logger';
const csvLogger = GetLogger('csv')

export const csvParseTE = (
  content: Buffer,
  options: csvParse.Options
): TE.TaskEither<
  AppError,
  {
    records: any;
    info: csvParse.Info;
  }
> =>
  TE.tryCatch(
    () =>
      new Promise((resolve, reject) => {
        csvParse(content, options, (error, records, info) => {
          if (error) {
            csvLogger.error('CSV Parse error: %O', error);
            return reject(error);
          }
          csvLogger.debug('CSV Parse results: %O', records);
          return resolve({ records, info });
        });
      }),
    toAppError
  );

export const csvStringifyTE = (
  records: any[],
  options: csvStringify.Options
): TE.TaskEither<AppError, string> =>
  TE.tryCatch(
    () =>
      new Promise((resolve, reject) => {
        csvStringify.stringify(records, options, (error, info) => {
          if (error) {
            csvLogger.error('CSV Stringify error: %O', error);
            return reject(error);
          }
          csvLogger.debug('CSV Stringify results: %O', records);
          return resolve(info);
        });
      }),
    toAppError
  );
