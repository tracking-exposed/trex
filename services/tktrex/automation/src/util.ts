import Crypto from 'crypto';

import fs from 'fs';

import { mkdir, stat } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import readline from 'readline';
import { URL } from 'url';

import * as TE from 'fp-ts/lib/TaskEither';

import fetch from 'node-fetch';
import puppeteer, { Page } from 'puppeteer';
import unzip from 'unzipper';

export type TEString = TE.TaskEither<Error, string>;

export const toError = (e: unknown): Error => {
  if (e instanceof Error) {
    return e;
  }
  return new Error('unspecified error');
};

export const prompt = async(message: string): Promise<string> =>
  new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(message, (answer) => {
      rl.close();
      return resolve(answer);
    });
  });

export const sleep = async(ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const tmpDir = async(prefix?: string): Promise<string> => {
  const dir = tmpdir();
  const name = prefix
    ? `${prefix}-${Crypto.randomBytes(8).toString('hex')}`
    : '';
  const path = join(dir, name);
  await mkdir(path);
  return path;
};

export const fileExists = async(path: string): Promise<boolean> => {
  try {
    await stat(path);
    return true;
  } catch (e) {
    return false;
  }
};

const createExtensionDirectoryFromFile = async(
  file: string,
): Promise<string> => {
  const path = await tmpDir('extension');

  fs.createReadStream(file).pipe(unzip.Extract({ path }));

  return path;
};

const createExtensionDirectoryFromURL = async(url: URL): Promise<string> => {
  const path = await tmpDir('extension');
  const res = await fetch(url.href);

  if (!res.body) {
    throw new Error('no body in response from node-fetch');
  }

  res.body.pipe(unzip.Extract({ path }));

  return path;
};

export const createExtensionDirectory = (
  extensionSource: string,
): Promise<string> => {
  try {
    const url = new URL(extensionSource);
    return createExtensionDirectoryFromURL(url);
  } catch (e) {
    return createExtensionDirectoryFromFile(extensionSource);
  }
};

export const setupBrowser = async({
  chromePath,
  extensionSource,
  profile,
}: {
  chromePath: string;
  extensionSource: string;
  profile: string;
}): Promise<[Page, string | undefined]> => {
  let extPath: string | undefined;
  const extBackupDir = join(profile, 'tx.tt.extension');
  const extBackupDirExists = await fileExists(extBackupDir);


  const args = ['--no-sandbox', '--disabled-setuid-sandbox'];

  if (extBackupDirExists) {
    args.push(`--load-extension=${extBackupDir}`);
    args.push(`--disable-extensions-except=${extBackupDir}`);
  } else if (extensionSource !== 'user-provided') {
    extPath = await createExtensionDirectory(extensionSource);
    args.push(`--load-extension=${extPath}`);
    args.push(`--disable-extensions-except=${extPath}`);
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

  const browser = await puppeteer.launch(options);
  const page = await browser.newPage();

  return [page, extPath];
};

export const typeLikeAHuman = async(page: Page, text: string): Promise<Page> => {
  const averageWordsPerMinute = 60;
  const averageCharactersPerWord = 5;

  const humanDurationMs = (text.length / averageCharactersPerWord) / averageWordsPerMinute * 60 * 1000;
  const letterDurationMs = humanDurationMs / text.length;

  for (const letter of text) {
    await page.keyboard.type(letter);
    await sleep(letterDurationMs * (0.6 + Math.random() * 0.8));
  }

  return page;
};

export const fillInput = async(page: Page, selector: string, value: string): Promise<Page> => {
  await page.waitForSelector(selector);
  await page.focus(selector);
  await page.keyboard.down('Control');
  await page.keyboard.press('A');
  await page.keyboard.up('Control');
  await page.keyboard.press('Backspace');
  await typeLikeAHuman(page, value);

  return page;
};
