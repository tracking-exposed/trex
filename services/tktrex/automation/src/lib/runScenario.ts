import readline from 'readline';

import puppeteer from 'puppeteer';

import { AutomationScenario, AutomationStep } from '@shared/models/Automation';

import { CommandConfig } from '../models/CommandCreator';

export const prompt = (question: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
};

export const sleep = async(ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

interface Context {
  loggedIn: boolean;
}

/**
 * Checks if a captcha is present on the page, if so,
 * wait until it is not present anymore (and ask user to solve it).
 */
export const handleCaptcha = async(
  config: CommandConfig,
  page: puppeteer.Page,
): Promise<void> => {
  try {
    await page.waitForSelector('#captcha-verify-image', {
      visible: true,
      timeout: 5000,
    });

    config.log.info('captcha detected, please solve it');

    for (;;) {
      try {
        await page.waitForSelector('#captcha-verify-image', {
          visible: true,
          timeout: 5000,
        });

        config.log.info('waiting for captcha to disappear...');
        await sleep(5000);
      } catch (err) {
        config.log.info('thanks for solving the captcha');
        break;
      }
    }
  } catch (err) {
    // ignore
  }
};

export const runStep = async(
  config: CommandConfig,
  context: Context,
  page: puppeteer.Page,
  step: AutomationStep,
): Promise<Context> => {
  config.log.debug('running step: %O', step);

  if (step.type === 'search') {
    await page.goto(step.platformURL);

    await handleCaptcha(config, page);

    /*
    await page.waitForSelector('#search-input');
    await page.type('#search-input', step.query);
    await page.keyboard.press('Enter');
    */

    return context;
  }

  throw new Error('unsupported step type');
};

export const dryRunAutomation =
  (config: CommandConfig) =>
    async(scenario: AutomationScenario): Promise<void> => {
      config.log.info('dry-running automation scenario...');

      const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized'],
      });

      const page = await browser.newPage();

      const scriptReducer = async(
        ctx: Promise<Context>,
        step: AutomationStep,
      ): Promise<Context> => runStep(config, await ctx, page, step);

      await scenario.script.reduce(
        scriptReducer,
        Promise.resolve({
          loggedIn: false,
        }),
      );

      await browser.close();
    };
