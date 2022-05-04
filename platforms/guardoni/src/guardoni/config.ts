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
import { CHROME_PATHS, getChromePath } from './utils';
import * as Json from 'fp-ts/lib/Json';
import {
  DEFAULT_LOAD_FOR,
  DEFAULT_TK_BACKEND,
  DEFAULT_TK_EXTENSION_DIR,
  DEFAULT_YT_BACKEND,
  DEFAULT_YT_EXTENSION_DIR,
} from './constants';

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
    confOverride: Partial<GuardoniConfig>
  ): TE.TaskEither<AppError, GuardoniConfig> => {
    const configFilePath = getConfigPath(basePath);

    const sanitizedConf = Object.entries(confOverride).reduce<
      Partial<GuardoniConfig>
    >(
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

    const readExistingConfigT = pipe(
      IOE.tryCatch(() => {
        return fs.readFileSync(configFilePath, 'utf-8');
      }, toAppError),
      TE.fromIOEither,
      TE.chainEitherK((content) => Json.parse(content)),
      TE.map((json) => json as any)
    );

    const defaultConfigT = TE.right<unknown, GuardoniConfig>({
      chromePath: CHROME_PATHS[0],
      headless: true,
      verbose: false,
      loadFor: DEFAULT_LOAD_FOR,
      basePath,
      profileName: 'default',
      evidenceTag: '',
      advScreenshotDir: undefined,
      excludeURLTag: undefined,
      ...sanitizedConf,
      yt: {
        name: 'youtube',
        backend: DEFAULT_YT_BACKEND,
        extensionDir: confOverride.yt?.extensionDir ?? DEFAULT_YT_EXTENSION_DIR,
        proxy: undefined,
        ...sanitizedConf.yt,
      },
      tk: {
        name: 'tiktok',
        backend: DEFAULT_TK_BACKEND,
        extensionDir: confOverride.tk?.extensionDir ?? DEFAULT_TK_EXTENSION_DIR,
        proxy: undefined,
        ...sanitizedConf.tk,
      },
    });

    const configExists = fs.existsSync(configFilePath);
    ctx.logger.debug(
      'Config file path [%s] exists ? (%s)',
      configFilePath,
      configExists
    );

    const readConfigT = configExists ? readExistingConfigT : defaultConfigT;

    return pipe(
      readConfigT,
      TE.map((config) => {
        return {
          chromePath: CHROME_PATHS[0],
          ...config,
          ...sanitizedConf,
          yt: {
            ...config.yt,
            ...sanitizedConf.yt,
            extensionDir: path.isAbsolute(config.yt.extensionDir)
              ? config.yt.extensionDir
              : path.resolve(basePath, config.yt.extensionDir),
          },
          tk: {
            ...config.tk,
            ...sanitizedConf.tk,
            extensionDir: path.isAbsolute(config.tk.extensionDir)
              ? config.tk.extensionDir
              : path.resolve(basePath, config.tk.extensionDir),
          },
        };
      }),
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
      )
    );
  };

export const getPlatformConfig = (
  p: Platform,
  { tk, yt, ...config }: GuardoniConfig
): Omit<GuardoniPlatformConfig, 'basePath' | 'chromePath' | 'evidenceTag'> => {
  const platformConfigKey = getConfigPlatformKey(p);

  const platformConf = platformConfigKey === 'tk' ? tk : yt;

  const extensionDir = path.isAbsolute(platformConf.extensionDir)
    ? platformConf.extensionDir
    : path.resolve(config.basePath, platformConf.extensionDir);

  return {
    ...platformConf,
    extensionDir,
  };
};

export const setConfig = (
  basePath: string,
  c: GuardoniConfig
): TE.TaskEither<AppError, GuardoniConfig> => {
  const configFilePath = getConfigPath(basePath);
  return pipe(
    IOE.fromEither(
      GuardoniConfig.decode({
        ...c,
      })
    ),
    IOE.mapLeft((e) => toAppError(failure(e))),
    IOE.chain((config) =>
      IOE.tryCatch(() => {
        return fs.writeFileSync(
          configFilePath,
          JSON.stringify(config, null, 2),
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
    { yt, tk, ...confOverride }: Partial<GuardoniConfig>
  ): TE.TaskEither<AppError, GuardoniConfig> => {
    ctx.logger.debug(
      'Get config with defaults %O for platform %s',
      { ...confOverride, yt, tk },
      platform
    );

    // get platform specific config
    const evidenceTag =
      confOverride.evidenceTag ?? 'no-tag-' + _.random(0, 0xffff);
    ctx.logger.debug('EvidenceTag %O', evidenceTag);

    const basePath = path.isAbsolute(_basePath)
      ? _basePath
      : path.resolve(process.cwd(), _basePath);

    // const yt = {
    //   ..._yt,
    //   extensionDir: _yt?.extensionDir
    //     ? path.isAbsolute(_yt?.extensionDir)
    //       ? _yt?.extensionDir
    //       : path.resolve(basePath, _yt?.extensionDir)
    //     : undefined,
    // };

    // const tk = {
    //   name: 'youtube',
    //   ..._tk,
    //   extensionDir: _tk?.extensionDir
    //     ? path.isAbsolute(_tk?.extensionDir)
    //       ? _tk?.extensionDir
    //       : path.resolve(basePath, _tk?.extensionDir)
    //     : undefined,
    // };

    return pipe(
      readConfigFromPath(ctx)(basePath, {
        ...confOverride,
        basePath,
        evidenceTag,
        yt,
        tk,
      }),
      TE.chain((config) =>
        pipe(
          getChromePath(),
          TE.fromEither,
          TE.mapLeft(toAppError),
          TE.map((chromePath) => ({
            ...config,
            chromePath,
            ...confOverride,
            yt: {
              ...config.yt,
              ...yt,
            },
            tk: {
              ...config.tk,
              ...tk,
            },
          }))
        )
      ),
      TE.map((config) => {
        const c = {
          ...config,
          chromePath: config.chromePath,
          basePath,
          evidenceTag,
        };

        ctx.logger.debug('Config %O', c);

        return c;
      })
    );
  };
