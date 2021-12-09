// import puppeteerExtra from 'puppeteer-extra';
import { GetLogger, Logger } from '@shared/logger';
import * as E from 'fp-ts/lib/Either';
import * as t from 'io-ts';
import { PathReporter } from 'io-ts/lib/PathReporter';
import * as path from 'path';
import puppeteer from 'puppeteer';
import { TestENV } from './TestENV';

const logger = GetLogger('pup-test');
const extensionOutputDir = path.resolve(path.join(process.cwd(), 'build/extension'));

const extensionMatch = /^chrome-extension:\/\/([^.*]+)\/.+/;

export interface PupTest {
  browser: puppeteer.Browser;
  extensionId: string;
  extensionBaseURL: string;
  extensionPopupURL: string;
  extensionDashboardURL: string;
  extension: puppeteer.Target;
  logger: Logger;
}

const decodeOrThrow = <A>(
  e: unknown,
  decode: (a: unknown) => E.Either<t.ValidationError[], A>
): A => {
  const result = decode(e);

  if (E.isLeft(result)) {
    logger.error(`Validation errors: %O`, PathReporter.report(result));
    throw new Error('Validation failed.');
  }
  return result.right;
};

export const GetPupTest = async (): Promise<PupTest> => {
  // logger.debug('process.env %O', process.env);
  logger.debug(
    'puppeteer exec path from process %s',
    process.env.PUPPETEER_EXEC_PATH
  );

  logger.debug(
    'puppeteer.executablePath() %s',
    (puppeteer as any).executablePath()
  );
  const env = decodeOrThrow(
    {
      PUPPETEER_EXEC_PATH: (puppeteer as any).executablePath(),
      ...process.env,
    },
    TestENV.decode
  );

  logger.debug(`Env %O`, env);

  const browser = await puppeteer.launch({
    headless: false,
    executablePath: env.PUPPETEER_EXEC_PATH,
    ignoreDefaultArgs: ['--enable-automation'],
    args: [
      '--no-sandbox',
      `--load-extension=${extensionOutputDir}`,
      `--disable-extensions-except=${extensionOutputDir}`,
    ],
    slowMo: env.PUPPETEER_SLOW_MO,
  });

  browser.on('error', (err) => {
    logger.error(`An error occurred in browser %O`, err);
  });

  const targets = browser.targets();

  const extension = targets
    .reverse()
    .find((t) => extensionMatch.test(t.url())) as puppeteer.Target;

  const extensionId = extension.url().match(extensionMatch)?.[1];

  if (extensionId === undefined) {
    throw new Error("Puppeteer didn't start with any extension");
  }

  return {
    browser,
    extensionId,
    extensionBaseURL: `chrome-extension://${extensionId}`,
    extensionPopupURL: `chrome-extension://${extensionId}/popup.html`,
    extensionDashboardURL: `chrome-extension://${extensionId}/index.html`,
    extension,
    logger,
  };
};
