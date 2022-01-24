import { Page } from 'puppeteer';

import { askConfirmation } from '../../util/page';

import { sleep } from '../../util/general';
import { Logger } from '../../util/logger';

export const isLoggedIn = async(
  page: Page,
  timeout = 5000,
): Promise<boolean> => {
  try {
    const now = Date.now();

    // we're logged in on TikTok if the login button
    // is not visible, so check for that
    await page.waitForSelector('[data-e2e="top-login-button"]', {
      timeout,
    });

    // wait a bit for consistency in case the button
    // was immediately visible
    const elapsed = Date.now() - now;
    if (elapsed < timeout) {
      await sleep(timeout - elapsed);
    }

    return false;
  } catch (e) {
    // we reach this point if the login button is not visible,
    // hence we're logged in if and only if we're on the
    // TikTok website, which is the case if for instance
    // the TikTok logo is visible
    return page.$('[data-e2e="tiktok-logo"') !== null;
  }
};

/**
 * Loop until the function can detect that the provided
 * page is logged in on TikTok.
 */
export const ensureLoggedIn = async(
  page: Page,
  userWarned = false,
): Promise<true> => {
  const loggedIn = await isLoggedIn(page);

  if (!loggedIn) {
    if (!userWarned) {
      await askConfirmation(page)('Please log in to TikTok!');
    }

    return ensureLoggedIn(page, true);
  }

  return true;
};

/**
 * Checks if a captcha is present on the page, if so,
 * wait until it is not present anymore (and ask user to solve it).
 */
export const basicCaptchaHandler = async(
  page: Page,
  onCaptchaDetected: () => unknown | Promise<unknown>,
  onCaptchaSolved?: () => unknown | Promise<unknown>,
  onCaptchaAttemptFailed?: () => unknown | Promise<unknown>,
): Promise<void> => {
  const settlement = (
    cb?: () => unknown | Promise<unknown>,
  ): Promise<unknown> => Promise.resolve(cb?.());

  try {
    await page.waitForSelector('#captcha-verify-image', {
      visible: true,
      timeout: 5000,
    });

    await settlement(onCaptchaDetected);

    for (;;) {
      try {
        await page.waitForSelector('#captcha-verify-image', {
          visible: true,
          timeout: 5000,
        });

        await settlement(onCaptchaAttemptFailed);
        await sleep(5000);
      } catch (err) {
        await settlement(onCaptchaSolved);
        break;
      }
    }
  } catch (err) {
    // ignore
  }
};

export const createHandleCaptcha = (page: Page, logger: Logger) =>
  () =>
    basicCaptchaHandler(
      page,
      () => {
        logger.log('Captcha detected, please solve it!');
      },
      () => {
        logger.log('Captcha solved, thank you!!');
      },
      () => {
        logger.log('Captcha unsolved, please solve it!');
      },
    );
