import puppeteerVanilla, { Page, Dialog } from 'puppeteer';
import puppeteer from 'puppeteer-extra';
import stealth from 'puppeteer-extra-plugin-stealth';

import { prompt, sleep } from './util';

puppeteer.use(stealth());

export const launchBrowser = async({
  chromePath,
  unpackedExtensionDirectory,
  profile,
  proxy,
  useStealth,
}: {
  chromePath: string;
  unpackedExtensionDirectory: string;
  profile: string;
  proxy?: string | null;
  useStealth: boolean;
}): Promise<Page> => {
  const args = [
    '--no-sandbox',
    '--disabled-setuid-sandbox',
    `--load-extension=${unpackedExtensionDirectory}`,
    `--disable-extensions-except=${unpackedExtensionDirectory}`,
  ];

  if (proxy) {
    args.push(`--proxy-server=${proxy}`);
  }

  const options = {
    args,
    defaultViewport: {
      height: 1080,
      width: 1920,
    },
    executablePath: chromePath,
    headless: false,
    ignoreDefaultArgs: ['--disable-extensions'],
    userDataDir: profile,
  };

  const p = useStealth ? puppeteer : puppeteerVanilla;

  const browser = await p.launch(options);
  const page = await browser.newPage();

  return page;
};

export const askBrowserConfirmation =
  (page: Page) =>
    async(message: string, a?: AbortSignal): Promise<void> => {
      let dialog: Dialog | undefined;

      const handleDialog = (d: Dialog): void => {
        dialog = d;
      };

      if (a) {
        const dismissDialog = (): void => {
          on.off('dialog', handleDialog);
          if (dialog) {
            void dialog.dismiss().catch(() => {});
            dialog = undefined;
          }
        };

        a.addEventListener('abort', dismissDialog);
      }

      const on = page.on('dialog', handleDialog);

      return new Promise((resolve, reject) => {
        const p = page.evaluate((message) => {
          alert(message);
        }, message);

        if (a) {
          a.addEventListener('abort', () => {
            reject(new Error('aborted'));
          });
        }

        p.then(resolve, reject);
      });
    };

export const askConfirmation =
  (page: Page) =>
    async(...lines: string[]): Promise<void> => {
      const message = [...lines].join('\n');
      const forConsole = `\n${message}\n(press enter to confirm)\n`;
      const forBrowser = `\n${message}\n`;

      const bAbort = new AbortController();
      const cAbort = new AbortController();
      const browserAbort = (): void => bAbort.abort();
      const consoleAbort = (): void => cAbort.abort();

      const browserConfirmation = askBrowserConfirmation(page)(
        forBrowser,
        bAbort.signal,
      );
      const consoleConfirmation = prompt(forConsole, cAbort.signal);

      consoleConfirmation.then(browserAbort, browserAbort);
      browserConfirmation.then(consoleAbort, consoleAbort);

      await Promise.race([browserConfirmation, consoleConfirmation]);
    };

export const typeLikeAHuman = async(
  page: Page,
  text: string,
): Promise<Page> => {
  const averageWordsPerMinute = 60;
  const averageCharactersPerWord = 5;

  const humanDurationMs =
    (text.length / averageCharactersPerWord / averageWordsPerMinute) *
    60 *
    1000;
  const letterDurationMs = humanDurationMs / text.length;

  for (const letter of text) {
    await page.keyboard.type(letter);
    await sleep(letterDurationMs * (0.6 + Math.random() * 0.8));
  }

  return page;
};

export const fillInput = async(
  page: Page,
  selector: string,
  value: string,
): Promise<Page> => {
  await page.waitForSelector(selector);
  await page.focus(selector);
  await page.keyboard.down('Control');
  await page.keyboard.press('A');
  await page.keyboard.up('Control');
  await page.keyboard.press('Backspace');
  await typeLikeAHuman(page, value);

  return page;
};
