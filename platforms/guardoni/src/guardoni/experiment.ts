import { AppError, toAppError } from '@shared/errors/AppError';
import { toValidationError } from '@shared/errors/ValidationError';
import {
  CreateExperimentResponse,
  CreateExperimentSuccessResponse,
} from '@shared/models/Experiment';
import {
  ClickType,
  KeyPressType,
  OpenURLStepType,
  ScrollStepType,
  Step,
} from '@shared/models/Step';
import * as E from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';
import _ from 'lodash';
import { parseClickCommand } from '@shared/providers/puppeteer/steps/click';
import { parseKeypressCommand } from '@shared/providers/puppeteer/steps/keyPress';
import { csvParseTE } from '@shared/utils/csv.utils';
import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray';
import * as TE from 'fp-ts/lib/TaskEither';
import * as fs from 'fs';
import * as t from 'io-ts';
import { nonEmptyArray } from 'io-ts-types/lib/nonEmptyArray';
import { NonEmptyString } from 'io-ts-types/lib/NonEmptyString';
import path from 'path';
import {
  ExperimentInfo,
  GuardoniContext,
  GuardoniProfile,
  GuardoniSuccessOutput,
} from './types';
import { liftFromIOE } from './utils';
import { sequenceS } from 'fp-ts/lib/Apply';
import { Logger } from '@shared/logger';

export const validateNonEmptyString = (
  s: string
): E.Either<AppError, NonEmptyString> =>
  pipe(
    NonEmptyString.decode(s),
    E.mapLeft((e) => toValidationError('Empty experiment id', e))
  );

const validHookDelimiters = ['–', '-'];

export const parseExperimentCSV =
  (logger: GuardoniContext['logger']) =>
  (body: string): TE.TaskEither<AppError, NonEmptyArray<Step>> => {
    return pipe(
      csvParseTE(body, { columns: true, skip_empty_lines: true }),
      TE.mapLeft((e) => ({ ...e, name: 'APIError' as const })),
      TE.chain(({ records, info }) => {
        logger.debug('Entries %O', records);
        return TE.right({ records, info });
      }),
      TE.chain(({ records }) =>
        pipe(
          nonEmptyArray(t.any).decode(records),
          E.mapLeft((e) => {
            return toValidationError(
              "Can't create an experiment with no links",
              e
            );
          }),
          TE.fromEither
        )
      ),
      TE.chain((entries) =>
        pipe(
          entries.reduce((acc: any[], { onCompleted, ...r }: any) => {
            const queue = [];
            if (r.incrementScrollByPX && r.totalScroll) {
              const { incrementScrollByPX, totalScroll, interval } = r;
              const scrollStep = {
                type: ScrollStepType.value,
                incrementScrollByPX: +incrementScrollByPX,
                totalScroll: +totalScroll,
                interval: interval ? +r.interval : undefined,
              };

              queue.push(scrollStep);
            }

            if (typeof onCompleted === 'string') {
              if (validHookDelimiters.some((d) => onCompleted.includes(d))) {
                const commands = onCompleted.split(/-|–/).map((c) => c.trim());

                logger.debug('Parsing commands %O', commands);

                const onCompletedSteps = commands.reduce(
                  (acc: any[], c: string) => {
                    logger.debug('Parsing command "%s"', c);
                    if (c.startsWith('keypress')) {
                      pipe(
                        parseKeypressCommand(c.trim()),
                        E.fold(
                          (e) => {
                            logger.warn(e.name, e.message);
                          },
                          (opts) => {
                            logger.debug(
                              'Keypress command %s parsed %O',
                              c,
                              opts
                            );
                            const keypressStep = {
                              type: KeyPressType.value,
                              ...opts,
                            };
                            acc.push(keypressStep);
                          }
                        )
                      );
                    }
                    if (c.startsWith('click')) {
                      pipe(
                        parseClickCommand(c.trim()),
                        E.fold(
                          (e) => {
                            logger.warn(e.name, e.message);
                          },
                          (opts) => {
                            logger.debug('Click command %s parsed %O', c, opts);
                            const clickStep = {
                              type: ClickType.value,
                              ...opts,
                            };
                            acc.push(clickStep);
                          }
                        )
                      );
                    }
                    return acc;
                  },
                  []
                );

                queue.push(...onCompletedSteps);
              }
            }

            return acc
              .concat({
                ...r,
                loadFor: r.loadFor === '' ? undefined : r.loadFor,
                watchFor: r.watchFor === '' ? undefined : r.watchFor,
                type: OpenURLStepType.value,
              })
              .concat(queue);
          }, []),
          nonEmptyArray(Step).decode,
          E.mapLeft((e) =>
            toValidationError(
              `The given CSV is not compatible with directive the expected format\nYou can find examples on https://docs.tracking.exposed/guardoni/guardoni-intro`,
              e
            )
          ),
          TE.fromEither
        )
      )
    );
  };

export const readCSV =
  (logger: GuardoniContext['logger']) =>
  (filePath: string): TE.TaskEither<AppError, string> => {
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
      TE.map((b) => b.toString('utf-8')),
      TE.mapLeft((e) => {
        return {
          ...e,
          message: `Failed to read csv file ${filePath}`,
        };
      })
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
      readCSV(ctx.logger)(filePath),
      TE.chain(parseExperimentCSV(ctx.logger)),
      TE.chain(registerExperiment(ctx))
    );
  };

export const getDirective =
  (ctx: GuardoniContext) =>
  (
    experimentId: NonEmptyString
  ): TE.TaskEither<AppError, NonEmptyArray<Step>> => {
    return pipe(
      ctx.API.v2.Experiments.GetDirective({
        Params: {
          experimentId,
        },
      }),
      TE.mapLeft(toAppError),
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
      API.v2.Experiments.PostDirective({
        Body: steps,
        Headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      }),
      TE.mapLeft(toAppError),
      TE.chain((response) => {
        logger.debug('Create experiment response %O', response);

        if (CreateExperimentResponse.types[0].is(response)) {
          return TE.left(toAppError(new Error(response.error.message)));
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

export const getExperimentJSONPath = (
  platform: GuardoniContext['platform']
): string => path.join(platform.extensionDir, 'experiment.json');

export const saveExperiment =
  (ctx: GuardoniContext) =>
  (
    experimentId: NonEmptyString,
    profile: GuardoniProfile
  ): TE.TaskEither<AppError, ExperimentInfo> => {
    const experimentJSONPath = getExperimentJSONPath(ctx.platform);

    const experimentInfo = {
      experimentId,
      researchTag: ctx.config.researchTag,
      execCount: profile.execount,
      profileName: profile.profileName,
      when: new Date(),
    };

    ctx.logger.debug(
      'Saving experiment info in %s to be read by the extension %O',
      experimentJSONPath,
      experimentInfo
    );

    return pipe(
      liftFromIOE(() =>
        fs.writeFileSync(
          experimentJSONPath,
          JSON.stringify(experimentInfo),
          'utf-8'
        )
      ),
      TE.map(() => experimentInfo)
    );
  };

export const formatExperimentList = (experiments: any[]): any[] => {
  /* this function take as input the received experiment and removed all
   * keys with value 'undefined' so the output plotter doesn't report them */

  const r = experiments.map((e, index) => {
    const optimizedSteps = e.steps.map((step: any, stepOrder: number) => {
      return [JSON.stringify(_.omitBy(step, _.isNil)).replace(/[}{]/g, '')];
    });
    return {
      order: index + 1,
      id: e.experimentId,
      since: e.when,
      steps: optimizedSteps,
    };
  });
  return r;
};

export const listExperiments =
  (ctx: GuardoniContext) =>
  (): TE.TaskEither<AppError, GuardoniSuccessOutput> => {
    return pipe(
      ctx.API.v2.Experiments.GetPublicDirectives(),
      TE.mapLeft(toAppError),
      TE.map(
        (experiments): GuardoniSuccessOutput => ({
          message: 'Public Experiments Available',
          type: 'success',
          values:
            experiments.length > 0
              ? formatExperimentList(experiments)
              : [
                  {
                    experiments: [],
                  },
                ],
        })
      )
    );
  };

export const walkPaginatedRequest =
  (logger: Logger) =>
  <A, D>(
    apiReqFn: (i: any) => TE.TaskEither<AppError, A>,
    getTotal: (r: A) => number,
    getData: (r: A) => D[],
    skip: number,
    amount: number
  ): TE.TaskEither<AppError, D[]> => {
    const result: D[] = [];

    const loop = (
      skip: number,
      amount: number,
      result: D[]
    ): TE.TaskEither<AppError, D[]> => {
      logger.debug('Walking paginated requests: %d => %d', skip, amount);

      return pipe(
        apiReqFn({ skip, amount }),
        TE.mapLeft((e) => ({
          ...e,
          message: `Failed with skip(${skip}) and amount(${amount}): ${e.message}`,
        })),
        TE.chain((r) => {
          // logger.debug('Response: %o', r);
          const total = getTotal(r);
          logger.debug('Total %d', total);
          const data = getData(r);
          logger.debug('Data size %d', data.length);

          if (amount < total) {
            return loop(skip + amount, amount + amount, result.concat(data));
          }
          logger.debug('All elements collected, returning... %d', data.length);
          return TE.right(result.concat(data));
        })
      );
    };

    return loop(skip, amount, result);
  };

export interface DownloadExperimentOpts {
  metadata?: string;
  sigiState?: string;
  apiRequests?: string;
}

export const downloadExperiment =
  (ctx: GuardoniContext) =>
  (
    experimentId: NonEmptyString,
    out: string,
    opts: DownloadExperimentOpts
  ): TE.TaskEither<AppError, GuardoniSuccessOutput> => {
    ctx.logger.debug('Download experiment %s', experimentId);

    const tkDownloads = sequenceS(TE.ApplicativePar)({
      metadata: walkPaginatedRequest(ctx.logger)(
        (q) =>
          ctx.TKAPI.v2.Metadata.ListMetadata({
            Query: { ...q, experimentId },
          }),
        (r) =>
          r.totals.native +
          r.totals.foryou +
          r.totals.following +
          r.totals.profile +
          r.totals.search,
        (r) => r.data,
        0,
        50
      ),
      apiRequests: walkPaginatedRequest(ctx.logger)(
        (q) =>
          ctx.TKAPI.v2.Public.GETAPIEvents({
            Query: { ...q, experimentId },
          }),
        (r) => r.total,
        (r) => r.data,
        0,
        50
      ),
      sigiStates: walkPaginatedRequest(ctx.logger)(
        (q) =>
          ctx.TKAPI.v2.SigiState.ListSIGIState({
            Query: {
              ...q,
              experimentId,
              publicKey: undefined,
              researchTag: undefined,
            },
          }),
        (r) => r.total,
        (r) => r.data,
        0,
        20
      ),
    });

    const ytDownloads = sequenceS(TE.ApplicativePar)({
      metadata: walkPaginatedRequest(ctx.logger)(
        (q) =>
          ctx.API.v2.Metadata.ListMetadata({
            Query: {
              ...q,
              experimentId,
              publicKey: undefined,
              researchTag: undefined,
            },
          }),
        (r) =>
          r.totals.video +
          r.totals.home +
          r.totals.channel +
          r.totals.hashtag +
          r.totals.search,
        (r) => r.data,
        0,
        20
      ),
      apiRequests: TE.right([] as any[]),
      sigiStates: TE.right([] as any[]),
    });

    const downloadTasks: TE.TaskEither<
      AppError,
      { metadata: any; apiRequests: any; sigiStates: any }
    > = ctx.platform.name === 'tiktok' ? tkDownloads : ytDownloads;

    return pipe(
      downloadTasks,
      TE.chainFirst(() => {
        return TE.tryCatch(
          async () =>
            fs.mkdirSync(path.resolve(ctx.config.basePath, out), {
              recursive: true,
            }),
          toAppError
        );
      }),
      TE.chain(({ metadata, apiRequests, sigiStates }) => {
        const metadataPath = path.resolve(
          ctx.config.basePath,
          out,
          opts.metadata ?? 'metadata.json'
        );

        const apiRequestsPath = path.resolve(
          ctx.config.basePath,
          out,
          opts.apiRequests ?? 'apiRequests.json'
        );

        const sigiStatesPath = path.resolve(
          ctx.config.basePath,
          out,
          opts.sigiState ?? 'sigiStates.json'
        );

        return sequenceS(TE.ApplicativePar)({
          metadata: TE.tryCatch(async () => {
            fs.writeFileSync(metadataPath, JSON.stringify(metadata), 'utf-8');

            return metadataPath;
          }, toAppError),
          apiRequests: apiRequests
            ? TE.tryCatch(async () => {
                fs.writeFileSync(
                  apiRequestsPath,
                  JSON.stringify(apiRequests),
                  'utf-8'
                );
                return apiRequestsPath;
              }, toAppError)
            : TE.right(undefined),
          sigiStates: sigiStates
            ? TE.tryCatch(async () => {
                fs.writeFileSync(
                  sigiStatesPath,
                  JSON.stringify(sigiStates),
                  'utf-8'
                );
                return sigiStatesPath;
              }, toAppError)
            : TE.right(undefined),
        });
      }),
      TE.map(({ metadata, apiRequests, sigiStates }) => {
        const values: any[] = [{ 'Metadata saved at': metadata }];
        if (apiRequests) {
          values.push({ 'API Requests saved at': apiRequests });
        }
        if (sigiStates) {
          values.push({ 'SIGI States saved at': sigiStates });
        }
        return {
          type: 'success',
          message: 'Experiment data downloaded.',
          values,
        };
      })
    );
  };
