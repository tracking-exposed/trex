import { AppError, toAppError } from '@shared/errors/AppError';
import * as E from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';
import * as IOE from 'fp-ts/lib/IOEither';
import * as TE from 'fp-ts/lib/TaskEither';
import * as fs from 'fs';
import { failure } from 'io-ts/lib/PathReporter';
import _ from 'lodash';
import * as path from 'path';
import {
  GuardoniConfig,
  GuardoniContext,
  GuardoniPlatformConfig,
  Platform,
} from './types';
import { getChromePath } from './utils';
import * as Json from 'fp-ts/lib/Json';

export const getConfigPath = (basePath: string): string =>
  path.resolve(basePath, 'guardoni.config.json');

export const getConfigPlatformKey = (
  p: Platform
): keyof Pick<GuardoniConfig, 'yt' | 'tk'> => {
  if (p === 'tiktok') {
    return 'tk';
  }
  return 'yt';
};

export const readConfigFromPath =
  (ctx: { logger: GuardoniContext['logger'] }) =>
  (
    basePath: string,
    defaultConf: GuardoniConfig
  ): TE.TaskEither<AppError, GuardoniConfig> => {
    const configFilePath = getConfigPath(basePath);

    const readExistingConfigT = pipe(
      IOE.tryCatch(() => {
        return fs.readFileSync(configFilePath, 'utf-8');
      }, toAppError),
      TE.fromIOEither,
      TE.chainEitherK((content) => Json.parse(content))
    );

    const defaultConfigT = TE.right<GuardoniConfig, unknown>(defaultConf);

    const configExists = fs.existsSync(configFilePath);
    ctx.logger.debug(
      'Config file path [%s] exists ? (%s)',
      configFilePath,
      configExists
    );

    const readConfigT = configExists ? readExistingConfigT : defaultConfigT;

    return pipe(
      readConfigT,
      TE.mapLeft(toAppError),
      TE.chainEitherK((json) =>
        pipe(
          GuardoniConfig.decode(json),
          E.mapLeft(
            (err) =>
              new AppError(
                'DecodeConfigError',
                "Can't decode guardoni config",
                failure(err)
              )
          )
        )
      ),
      TE.map((config) => {
        return {
          ...config,
          yt: {
            ...config.yt,
            extensionDir: path.isAbsolute(config.yt.extensionDir)
              ? config.yt.extensionDir
              : path.resolve(basePath, config.yt.extensionDir),
          },
          tk: {
            ...config.tk,
            extensionDir: path.isAbsolute(config.tk.extensionDir)
              ? config.tk.extensionDir
              : path.resolve(basePath, config.tk.extensionDir),
          },
        };
      })
    );
  };

export const getPlatformConfig = (
  { tk, yt, ...config }: GuardoniConfig,
  p: Platform
): Omit<GuardoniPlatformConfig, 'basePath' | 'chromePath' | 'evidenceTag'> => {
  const platformConfigKey = getConfigPlatformKey(p);

  const platformConf = platformConfigKey === 'tk' ? tk : yt;

  const sanitizedConf = Object.entries(config).reduce<GuardoniConfig>(
    (acc, [key, value]) => {
      if (value !== undefined) {
        return {
          ...acc,
          [key]: value,
        };
      }
      return acc;
    },
    // eslint-disable-next-line @typescript-eslint/prefer-reduce-type-parameter
    {} as any
  );

  const extensionDir = path.isAbsolute(platformConf.extensionDir)
    ? platformConf.extensionDir
    : path.resolve(process.cwd(), platformConf.extensionDir);

  return {
    ...sanitizedConf,
    platform: {
      ...platformConf,
      extensionDir,
    },
  };
};

export const setConfig = (
  basePath: string,
  c: GuardoniConfig
): TE.TaskEither<AppError, GuardoniConfig> => {
  const configFilePath = getConfigPath(basePath);
  return pipe(
    IOE.fromEither(GuardoniConfig.decode(c)),
    IOE.mapLeft((e) => toAppError(failure(e))),
    IOE.chain((config) =>
      IOE.tryCatch(() => {
        return fs.writeFileSync(
          configFilePath,
          JSON.stringify(config),
          'utf-8'
        );
      }, toAppError)
    ),
    IOE.map(() => c),
    TE.fromIOEither
  );
};

export const getConfig =
  (ctx: { logger: GuardoniContext['logger'] }) =>
  (
    _basePath: string,
    platform: Platform,
    { yt, tk, ...confDefaults }: GuardoniConfig
  ): TE.TaskEither<AppError, GuardoniPlatformConfig> => {
    ctx.logger.debug(
      'Get config with defaults %O for platform %s',
      { ...confDefaults, yt, tk },
      platform
    );

    // get platform specific config
    const evidenceTag =
      confDefaults.evidenceTag ?? 'no-tag-' + _.random(0, 0xffff);
    ctx.logger.debug('EvidenceTag %O', evidenceTag);

    const basePath = path.isAbsolute(_basePath)
      ? _basePath
      : path.resolve(process.cwd(), _basePath);

    return pipe(
      readConfigFromPath(ctx)(basePath, {
        ...confDefaults,
        yt,
        tk,
      }),
      TE.chain((config) =>
        pipe(
          getChromePath(),
          TE.fromEither,
          TE.mapLeft(toAppError),
          TE.map((chromePath) => ({
            chromePath,
            ...confDefaults,
            ...config,
          }))
        )
      ),
      TE.map((config) => {
        return {
          ...getPlatformConfig(config, platform),
          chromePath: config.chromePath,
          basePath,
          evidenceTag,
        };
      })
    );
  };
