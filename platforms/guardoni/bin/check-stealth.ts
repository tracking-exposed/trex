import path from 'path';
import puppeteer from 'puppeteer-extra';
import { dispatchBrowser } from '../src/guardoni/browser';
import { getDefaultConfig } from '../src/guardoni/config';
import { guardoniLogger } from '../src/logger';


void (async () => {
  const ctx = {} as any
  await dispatchBrowser(ctx)({
    version: '1',
    guardoniConfigFile: 'guardoni.config.json',
    API: {} as any,
    config: getDefaultConfig(process.cwd()),
    puppeteer: puppeteer as any,
    logger: guardoniLogger,
    platform: {
      name: 'youtube',
      backend: 'http://localhost:9000/api',
      extensionDir: path.resolve(process.cwd(), '../yttrex/extension/build'),
      proxy: '',
    },
    profile: {
      udd: path.resolve(process.cwd(), 'profiles', 'default'),
      profileName: 'default',
      newProfile: true,
      execount: 0,
      evidencetag: [],
    },
  })().then(async (g) => {
    if (g._tag === 'Right') {
      const browser = g.right;
      const page = await browser.newPage();

      // Navigate to the page that will perform the tests.
      const testUrl =
        'https://intoli.com/blog/' +
        'not-possible-to-block-chrome-headless/chrome-headless-test.html';
      await page.goto(testUrl);

      // Save a screenshot of the results.
      const screenshotPath = path.resolve(
        process.cwd(),
        './screenshots/headless-test-result.png'
      );
      await page.screenshot({ path: screenshotPath });
      console.log('have a look at the screenshot:', screenshotPath);

      await browser.close();
    }
    return Promise.resolve();
  });
})();
