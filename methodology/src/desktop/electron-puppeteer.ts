/**
 *
 * references
 *
 * https://github.com/nondanee/puppeteer-electron
 * https://github.com/loukaspd/puppeteer-electron-quickstart
 * https://github.com/TrevorSundberg/puppeteer-in-electron
 * https://github.com/peterdanis/electron-puppeteer-demo
 * https://github.com/replace5/electron-puppeteer
 *
 *
 */
import { GetLogger } from "@shared/logger";
import * as electron from "electron";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import * as path from "path";
import puppeteer from "puppeteer-core";
import * as pie from "puppeteer-in-electron";

const pupLogger = GetLogger("pup");

export const browserFetcher = (
  puppeteer as any
).createBrowserFetcher() as puppeteer.BrowserFetcher;

pupLogger.debug(`Browser fetcher %O`, browserFetcher);

(puppeteer as any).defaultArgs({
  userDataDir: path.join(process.cwd(), "./executions"),
});

interface ConnectOptions {
  extensionDir: string;
  width: number;
  height: number;
  headless: boolean;
}

// export const run = (options: ConnectOptions): TE.TaskEither<Error, void> => {
//   pupLogger.debug(`Connect %O`, options);

//   return pipe(
//     TE.fromIO<string, Error>(getChromePath),
//     TE.filterOrElse(
//       (chromePath) => chromePath !== undefined,
//       () => new Error("Chrome path is missing!")
//     ),
//     TE.chain((chromePath) => {
//       const launchOptions = {
//         headless: options.headless,
//         executablePath: chromePath,
//         defaultViewport: null,
//         ignoreDefaultArgs: ["--disable-extensions"],
//         args: [
//           "--no-sandbox",
//           "--disable-gpu",
//           "--disabled-setuid-sandbox",
//           "--load-extension=" + options.extensionDir,
//           "--disable-extensions-except=" + options.extensionDir,
//           `--window-size=${options.width},${options.height}`,
//         ],
//       };
//       pupLogger.debug("Launching %O", launchOptions);
//       return TE.tryCatch(async (): Promise<void> => {
//         const revisions = await browserFetcher.localRevisions();

//         let revisionInfo;
//         if (revisions.length === 0) {
//           revisionInfo = await browserFetcher.download("533271");
//           pupLogger.debug(`Revision info %O`, revisionInfo);
//         } else {
//           revisionInfo = revisions[0];
//         }
//         pupLogger.debug(`Revision info %O`, revisions);

//         const browser = await puppeteer.launch({
//           ...launchOptions,
//           executablePath: revisionInfo.executablePath,
//         });

//         pupLogger.debug("Browser %O", browser);
//         const page = await browser.newPage();
//         await page.goto("http://tracking.exposed");
//         pupLogger.debug("Page %O", page);
//         await page.bringToFront();
//       }, E.toError);
//     })
//   );
//   // log.logInfo("Puppeteer initialized");
// };

export const run = (
  app: electron.App,
  options: ConnectOptions
): TE.TaskEither<Error, void> => {
  pupLogger.debug(`Connect %O`, options);

  const launchOptions = {
    headless: options.headless,
    // executablePath: chromePath,
    defaultViewport: null,
    ignoreDefaultArgs: ["--disable-extensions"],
    args: [
      "--no-sandbox",
      "--disable-gpu",
      "--disabled-setuid-sandbox",
      "--load-extension=" + options.extensionDir,
      "--disable-extensions-except=" + options.extensionDir,
      `--window-size=${options.width},${options.height}`,
    ],
  };
  pupLogger.debug("Launching %O", launchOptions);
  return TE.tryCatch(async (): Promise<void> => {
    const browser = await pie.connect(app, puppeteer);

    const page = await browser.newPage();
    await page.goto("http://tracking.exposed");
  }, E.toError);

  // log.logInfo("Puppeteer initialized");
};
