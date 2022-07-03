import { HookHandler } from '@shared/providers/puppeteer/DirectiveHook';
import { sleep } from '@shared/utils/promise.utils';
import * as qs from 'qs';
import { URL } from 'url';

interface TKLoginContext {
  getUsername: () => Promise<string>;
  getPassword: () => Promise<string>;
}

export const tkLogin =
  (ctx: TKLoginContext): HookHandler =>
  async (page, directive, opts) => {
    const url = page.url();
    const search = qs.parse(new URL(url).search);
    const redirectUrl = search.redirect_url as string;
    await page.goto('https://www.tiktok.com/login');

    const loginButton = await page.waitForSelector(
      '[class*="login-container"] > [class*="social-container"] > [class*="channel-item-wrapper"]:nth-of-type(2)'
    );

    await loginButton?.click();

    const loginWithEmailButton = await page.waitForSelector(
      'a[href="/login/phone-or-email/email"]'
    );

    await loginWithEmailButton?.click();

    const username = await ctx.getUsername();
    await page.type('input[name="email"]', username);

    const password = await ctx.getPassword();
    await page.type('input[name="password"]', password);

    await sleep(10000);

    const submitButton = await page.waitForSelector(
      'button[class*="login-button"]:not(disabled)',
      {
        timeout: 10000,
      }
    );

    await submitButton?.click();

    await page.goto(redirectUrl);

    return Promise.resolve(undefined);
  };
