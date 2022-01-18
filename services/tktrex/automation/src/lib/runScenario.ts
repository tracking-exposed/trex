import readline from 'readline';

import puppeteer from 'puppeteer';

import {
  AutomationScenario,
  AutomationStep,
} from '@shared/models/Automation';

import { CommandConfig } from '../models/CommandCreator';

const prompt = (question: string): Promise<string> => {
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

interface Context {
  loggedIn: boolean;
}

export const handleCaptcha = async(
  config: CommandConfig,
  page: puppeteer.Page,
): Promise<void> => {
  try {
    await page.waitForSelector(
      '#captcha-verify-image',
    );

    await prompt(
      '[CAPTCHA ALERT] Please solve the captcha then press enter.',
    );

    config.log.info('Thanks for solving the captcha, proceeding...');
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
    ): Promise<Context> =>
      runStep(config, await ctx, page, step);

    await scenario.script.reduce(
      scriptReducer,
      Promise.resolve({
        loggedIn: false,
      }),
    );

    await browser.close();
  };
