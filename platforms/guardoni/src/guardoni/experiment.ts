import { AppError, toAppError } from '@shared/errors/AppError';
import { toValidationError } from '@shared/errors/ValidationError';
import { Step, OpenURLStepType, ScrollStepType } from '@shared/models/Step';
import {
  CreateExperimentResponse,
  CreateExperimentSuccessResponse,
} from '@shared/models/Experiment';
import * as E from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';
// import * as NEA from 'fp-ts/lib/NonEmptyArray';
import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray';
import * as TE from 'fp-ts/lib/TaskEither';
import * as fs from 'fs';
import * as t from 'io-ts';
import { NonEmptyString } from 'io-ts-types/lib/NonEmptyString';
import { failure, PathReporter } from 'io-ts/lib/PathReporter';
import path from 'path';
import {
  ExperimentInfo,
  GuardoniContext,
  GuardoniProfile,
  GuardoniSuccessOutput,
} from './types';
import { csvParseTE, liftFromIOE } from './utils';

export const validateNonEmptyString = (
  s: string
): E.Either<AppError, NonEmptyString> =>
  pipe(
    NonEmptyString.decode(s),
    E.mapLeft((e) => toValidationError('Empty experiment id', failure(e)))
  );

export const readCSVAndParse =
  (logger: GuardoniContext['logger']) =>
  (filePath: string): TE.TaskEither<AppError, NonEmptyArray<Step>> => {
    logger.debug('Registering CSV from path %s', filePath);

    return pipe(
      liftFromIOE(() => fs.statSync(filePath)),
      TE.mapLeft((e) => {
        return toAppError({
          ...e,
          message: `File at path ${filePath} doesn't exist`,
        });
      }),
      TE.chain(() => liftFromIOE(() => fs.readFileSync(filePath))),
      TE.mapLeft((e) => {
        return toAppError({
          ...e,
          message: `Failed to read csv file ${filePath}`,
        });
      }),
      TE.chain((input) =>
        pipe(
          csvParseTE(input, { columns: true, skip_empty_lines: true }),
          TE.chain(({ records, info }) => {
            logger.debug(
              'Read input from file %s (%d bytes) %d records as %s',
              filePath,
              input.length,
              records.length
            );

            if (records.length === 0) {
              return TE.left(
                toAppError({
                  message: "Can't create an experiment with no links",
                })
              );
            }

            return TE.right({ records, info });
          }),
          TE.chain(({ records }) =>
            pipe(
              t.array(Step).decode(
                records.reduce((acc: any[], r: any) => {
                  if (r.incrementScrollByPX && r.totalScroll) {
                    const {
                      incrementScrollByPX,
                      totalScroll,
                      interval,
                      ...rest
                    } = r;
                    return acc.concat([
                      rest,
                      {
                        type: ScrollStepType.value,
                        incrementScrollByPX: +incrementScrollByPX,
                        totalScroll: +totalScroll,
                        interval: interval ? +r.interval : undefined,
                      },
                    ]);
                  }

                  return acc.concat({
                    ...r,
                    loadFor: r.loadFor === '' ? undefined : r.loadFor,
                    watchFor: r.watchFor === '' ? undefined : r.watchFor,
                    type: OpenURLStepType.value,
                  });
                }, [] as any[])
              ),
              TE.fromEither,
              TE.mapLeft((e) => {
                return new AppError(
                  'CSVParseError',
                  `The given CSV is not compatible with directive the expected format`,
                  [
                    ...PathReporter.report(E.left(e)),
                    '\n',
                    'You can find examples on https://docs.tracking.exposed/guardoni/guardoni-intro',
                  ]
                );
              })
            )
          ),
          TE.map((records) => {
            logger.debug('CSV decoded content %O', records);
            return records as NonEmptyArray<Step>;
          })
        )
      )
    );
  };

export const registerCSV =
  (ctx: GuardoniContext) =>
  (csvFile: string): TE.TaskEither<AppError, GuardoniSuccessOutput> => {
    // resolve csv file path from current working direction when is not absolute
    const filePath = path.isAbsolute(csvFile)
      ? csvFile
      : path.resolve(process.cwd(), csvFile);

    ctx.logger.debug(`Register CSV from %s`, filePath);

    return pipe(
      readCSVAndParse(ctx.logger)(filePath),
      TE.chain(registerExperiment(ctx))
    );
  };

export const getDirective =
  (ctx: GuardoniContext) =>
  (
    experimentId: NonEmptyString
  ): TE.TaskEither<AppError, NonEmptyArray<Step>> => {
    return pipe(
      // TODO this should become v2
      ctx.API.v3.Public.GetDirective({
        Params: {
          experimentId,
        },
      }),
      TE.map((response) => {
        ctx.logger.warn('Response %O', response);

        ctx.logger.debug(`Data for experiment (%s) %O`, experimentId, response);

        const data = response as any[] as NonEmptyArray<Step>;

        return data;
      })
    );
  };

export const createExperimentInAPI =
  ({ API, logger }: GuardoniContext) =>
  (
    steps: NonEmptyArray<Step>
  ): TE.TaskEither<AppError, CreateExperimentSuccessResponse> => {
    return pipe(
      API.v3.Public.PostDirective({
        Body: steps,
        Headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      }),
      TE.chain((response) => {
        logger.debug('Create experiment response %O', response);

        if (CreateExperimentResponse.types[0].is(response)) {
          return TE.left(
            new AppError('PostDirectiveError', response.error.message, [])
          );
        }

        return TE.right(response);
      })
    );
  };

export const registerExperiment =
  (ctx: GuardoniContext) =>
  (
    records: NonEmptyArray<Step>
  ): TE.TaskEither<AppError, GuardoniSuccessOutput> => {
    ctx.logger.debug('Creating experiment %O', records);
    return pipe(
      createExperimentInAPI(ctx)(records),
      TE.map((experiment) => {
        ctx.logger.debug('Experiment received %O', experiment);
        // handle output for existing experiment
        if (
          CreateExperimentSuccessResponse.is(experiment) &&
          experiment.status === 'exist'
        ) {
          return {
            type: 'success',
            message: `Experiment already available`,
            values: [experiment],
          };
        }

        return {
          type: 'success',
          message: `Experiment created successfully`,
          values: [experiment],
        };
      })
    );
  };

export const saveExperiment =
  (ctx: GuardoniContext) =>
  (
    experimentId: NonEmptyString,
    profile: GuardoniProfile
  ): TE.TaskEither<AppError, ExperimentInfo> => {
    ctx.logger.debug(
      'Saving experiment info in extension/experiment.json (would be read by the extension)'
    );

    const experimentJSONFile = path.join(
      ctx.platform.extensionDir,
      'experiment.json'
    );

    const experimentInfo = {
      experimentId,
      researchTag: ctx.config.researchTag,
      execCount: profile.execount,
      profileName: profile.profileName,
      newProfile: profile.newProfile,
      when: new Date(),
    };

    return pipe(
      liftFromIOE(() =>
        fs.statSync(experimentJSONFile, { throwIfNoEntry: false })
      ),
      TE.chain((stat) => {
        if (stat) {
          return TE.right(undefined);
        }
        return liftFromIOE(() =>
          fs.writeFileSync(
            experimentJSONFile,
            JSON.stringify(experimentInfo),
            'utf-8'
          )
        );
      }),
      TE.map(() => experimentInfo)
    );
  };

export const listExperiments =
  (ctx: GuardoniContext) =>
  (): TE.TaskEither<AppError, GuardoniSuccessOutput> => {
    return pipe(
      ctx.API.v3.Public.GetPublicDirectives(),
      TE.map(
        (experiments): GuardoniSuccessOutput => ({
          message: 'Experiments List',
          type: 'success',
          values:
            experiments.length > 0
              ? experiments.map((e) => ({
                  [e.experimentId]: e,
                }))
              : [
                  {
                    experiments: [],
                  },
                ],
        })
      )
    );
  };
