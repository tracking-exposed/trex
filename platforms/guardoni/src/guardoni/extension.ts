/**
 *
 * Guardoni V2
 *
 * TODO:
 * - filter the step with "exclude url tag"
 *
 */
import { AppError, toAppError } from '@shared/errors/AppError';
import { UserSettings } from '@shared/extension/models/UserSettings';
import axios from 'axios';
import extractZip from 'extract-zip';
import { pipe } from 'fp-ts/lib/function';
import * as IOE from 'fp-ts/lib/IOEither';
import * as TE from 'fp-ts/lib/TaskEither';
import * as fs from 'fs';
import path from 'path';
import { getExperimentJSONPath } from './experiment';
import { GuardoniContext, Platform } from './types';

/**
 * Build the url to download the extension with "data collection" opt-in
 */
const getExtensionWithOptInURL = (platform: Platform, v: string): string => {
  const platformChunk = platform === 'youtube' ? 'yttrex' : 'tktrex';
  return `https://github.com/tracking-exposed/yttrex/releases/download/v${v}/${platformChunk}-guardoni-extension-${v}.zip`;
};

/**
 * Download the extension if not present
 */
export const downloadExtension = (
  ctx: GuardoniContext
): TE.TaskEither<AppError, void> => {
  const extensionDir = ctx.platform.extensionDir;

  return pipe(
    IOE.tryCatch(() => {
      ctx.logger.debug(`Checking extension manifest.json at %s`, extensionDir);

      const manifestPath = path.resolve(
        path.join(extensionDir, 'manifest.json')
      );

      const manifest = fs.existsSync(manifestPath);

      if (manifest) {
        const m = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
        const httpPerms = m.permissions.filter((p: string) =>
          p.startsWith('http')
        );

        if (m.version === ctx.version) {
          ctx.logger.info(
            `Manifest found, no need to download the extension: %s (%O)`,
            m.version,
            httpPerms
          );
        } else {
          ctx.logger.warn(
            'WARNING: Manifest found, but extension version mismatch: %s (guardoni %s)',
            m.version,
            ctx.version
          );
        }

        return undefined;
      }

      ctx.logger.debug('Ensure %s dir exists', extensionDir);
      fs.mkdirSync(extensionDir, { recursive: true });

      ctx.logger.debug(
        "Executing curl and unzip (if these binary aren't present in your system please mail support at tracking dot exposed because you might have worst problems)"
      );
      const extensionZipFilePath = path.resolve(
        path.join(
          extensionDir,
          `${ctx.platform.name}-trex-extension-v${ctx.version}.zip`
        )
      );

      const extensionZipUrl = getExtensionWithOptInURL(
        ctx.platform.name,
        ctx.version
      );

      return { extensionZipUrl, extensionZipFilePath };
    }, toAppError),
    TE.fromIOEither,
    TE.chain((downloadDetails) => {
      if (!downloadDetails) {
        return TE.right(undefined);
      }

      const extensionExists = fs.existsSync(
        downloadDetails.extensionZipFilePath
      );

      ctx.logger.debug(
        'Extension exists at path %s? %s',
        downloadDetails.extensionZipFilePath,
        extensionExists
      );

      const downloadAndSaveTE = pipe(
        TE.tryCatch(() => {
          ctx.logger.debug(
            'Download extension from remote %s',
            downloadDetails.extensionZipUrl
          );
          return axios
            .request({
              url: downloadDetails.extensionZipUrl,
              responseType: 'arraybuffer',
            })
            .then((r) => r.data);
        }, toAppError),
        TE.chainIOEitherK((buf) =>
          IOE.tryCatch(() => {
            ctx.logger.debug(
              'Saving extension to %s',
              downloadDetails.extensionZipFilePath
            );
            fs.writeFileSync(
              downloadDetails.extensionZipFilePath,
              buf,
              'utf-8'
            );
          }, toAppError)
        )
      );

      return pipe(
        extensionExists ? TE.right(undefined) : downloadAndSaveTE,
        TE.chain(() =>
          TE.tryCatch(() => {
            ctx.logger.debug(
              'Extracting extension from %s and save it to %s',
              downloadDetails.extensionZipFilePath,
              extensionDir
            );
            return extractZip(downloadDetails.extensionZipFilePath, {
              dir: extensionDir,
            });
          }, toAppError)
        )
      );
    })
  );
};

/**
 * Clean extension directory
 *
 * @param ctx
 * @returns
 */

export const cleanExtension =
  (ctx: GuardoniContext) => (): TE.TaskEither<AppError, void> => {
    const extensionDir = ctx.platform.extensionDir;
    ctx.logger.info('Cleaning extension dir %s', extensionDir);

    return pipe(
      IOE.tryCatch(() => {
        const experimentJSON = getExperimentJSONPath(ctx);
        ctx.logger.debug('Checking %s exists', experimentJSON);
        if (fs.existsSync(experimentJSON)) {
          ctx.logger.info(
            '\nREMOVING %s:\n %O\n',
            experimentJSON,
            JSON.parse(fs.readFileSync(experimentJSON, 'utf-8'))
          );
        }

        const settingsJSON = getSettingsJSONPath(ctx);
        ctx.logger.debug('Checking %s exists', settingsJSON);
        if (fs.existsSync(settingsJSON)) {
          ctx.logger.info(
            '\nREMOVING settings.json:\n %O \n',
            JSON.parse(fs.readFileSync(settingsJSON, 'utf-8'))
          );
        }

        fs.rmSync(extensionDir, { recursive: true });
        fs.mkdirSync(extensionDir);
      }, toAppError),
      TE.fromIOEither
    );
  };

const getSettingsJSONPath = (ctx: GuardoniContext): string =>
  path.resolve(ctx.platform.extensionDir, 'settings.json');

export const setLocalSettings =
  (ctx: GuardoniContext) =>
  (s?: Partial<UserSettings>): void => {
    const keys = Object.keys(s ?? {});
    const settingsJsonPath = getSettingsJSONPath(ctx);
    if (keys.length === 0) {
      ctx.logger.debug('No values for %s given...', settingsJsonPath);
      return;
    }

    ctx.logger.info('Saving settings at %s: %O', settingsJsonPath, s);
    const settings = JSON.stringify(s);
    fs.writeFileSync(settingsJsonPath, settings);
  };
