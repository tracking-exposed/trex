import { AppError } from '@shared/errors/AppError';
import { toValidationError } from '@shared/errors/ValidationError';
import {
  SearchDirective,
  SearchDirectiveType,
  ComparisonDirectiveRow,
  ComparisonDirectiveType,
  Directive,
  DirectiveType,
  PostDirectiveResponse,
  PostDirectiveSuccessResponse,
} from '@shared/models/Directive';
import * as E from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';
import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray';
import * as TE from 'fp-ts/lib/TaskEither';
import * as fs from 'fs';
import { NonEmptyString } from 'io-ts-types/lib/NonEmptyString';
import { failure } from 'io-ts/lib/PathReporter';
import path from 'path';
// import pluginStealth from "puppeteer-extra-plugin-stealth";
import {
  ExperimentInfo,
  GuardoniContext,
  GuardoniProfile,
  GuardoniSuccessOutput,
} from './types';
import { liftFromIOE } from './utils';

export const validateNonEmptyString = (
  s: string
): E.Either<AppError, NonEmptyString> =>
  pipe(
    NonEmptyString.decode(s),
    E.mapLeft((e) => toValidationError('Empty experiment id', failure(e)))
  );

export const getDirective =
  (ctx: GuardoniContext) =>
  (
    experimentId: NonEmptyString
  ): TE.TaskEither<
    AppError,
    { type: DirectiveType; data: NonEmptyArray<Directive> }
  > => {
    return pipe(
      ctx.API.v3.Public.GetDirective({
        Params: {
          experimentId,
        },
      }),
      TE.map((data) => {
        ctx.logger.debug(`Data for experiment (%s) %O`, experimentId, data);
        const directiveType = SearchDirective.is(data[0])
          ? SearchDirectiveType.value
          : ComparisonDirectiveType.value;

        return { type: directiveType, data };
      })
    );
  };

export const createExperimentInAPI =
  ({ API, logger }: GuardoniContext) =>
  (
    directiveType: DirectiveType,
    parsedCSV: NonEmptyArray<ComparisonDirectiveRow>
  ): TE.TaskEither<AppError, PostDirectiveSuccessResponse> => {
    return pipe(
      API.v3.Public.PostDirective({
        Params: { directiveType },
        Body: { parsedCSV },
        Headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      }),
      TE.chain((response) => {
        logger.debug('Create experiment response %O', response);

        if (PostDirectiveResponse.types[0].is(response)) {
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
    records: NonEmptyArray<ComparisonDirectiveRow>,
    directiveType: DirectiveType
  ): TE.TaskEither<AppError, GuardoniSuccessOutput> => {
    ctx.logger.debug('Creating experiment %O', { records, directiveType });
    return pipe(
      createExperimentInAPI(ctx)(directiveType, records),
      TE.map((experiment) => {
        ctx.logger.debug('Experiment received %O', experiment);
        // handle output for existing experiment
        if (
          PostDirectiveSuccessResponse.is(experiment) &&
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
    directiveType: DirectiveType,
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
      evidenceTag: ctx.config.evidenceTag,
      directiveType,
      execCount: profile.execount,
      profileName: profile.profileName,
      newProfile: profile.newProfile,
      when: new Date(),
    };

    // profinfo.expinfo = experimentInfo;

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

export const concludeExperiment =
  (ctx: GuardoniContext) =>
  (experimentInfo: ExperimentInfo): TE.TaskEither<AppError, ExperimentInfo> => {
    // this conclude the API sent by extension remoteLookup,
    // a connection to DELETE /api/v3/experiment/:publicKey

    return pipe(
      ctx.API.v3.Public.ConcludeExperiment({
        Params: {
          testTime: experimentInfo.when.toISOString(),
        },
      }),
      TE.chain((body) => {
        if (!body.acknowledged) {
          return TE.left(
            new AppError('APIError', "Can't conclude the experiment", [])
          );
        }
        return TE.right(experimentInfo);
      })
    );
  };
