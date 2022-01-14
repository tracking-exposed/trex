import puppeteer from 'puppeteer';

const main = async(): Promise<void> => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized'],
  });

  const page = await browser.newPage();
  await page.goto('https://example.com');

  await browser.close();
};

main().finally(() => {
  process.exit(0);
});
