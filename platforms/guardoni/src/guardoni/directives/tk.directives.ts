import { DirectiveHooks } from '@shared/providers/puppeteer/DirectiveHook';
import * as puppeteer from 'puppeteer-core';
import { GuardoniProfile } from '../types';

interface GlobalConfig {
  publicKeySpot: string | null;
}

const globalConfig: GlobalConfig = {
  publicKeySpot: null,
};

async function consoleLogParser(
  page: puppeteer.Page,
  message: puppeteer.ConsoleMessage
): Promise<void> {
  /* this function is primarly meant to collect the public key,
   * but it is also an indirect, pseudo-efficent way to communicate
   * between puppeteer evaluated selectors and action we had to do */
  const l = message.text();
  if (globalConfig.publicKeySpot === null && l.match(/publicKey/)) {
    const material = JSON.parse(l);
    globalConfig.publicKeySpot = material.response.publicKey;
  }
}

async function beforeDirectives(
  page: puppeteer.Page,
  directive: any
): Promise<any> {
  page.on('console', (event) => {
    void consoleLogParser(page, event);
  });

  return Promise.resolve();
}

async function beforeLoad(page: puppeteer.Page, directive: any): Promise<any> {
  return Promise.resolve();
}

async function completed(): Promise<string> {
  return globalConfig.publicKeySpot as string;
}

async function beforeWait(page: puppeteer.Page, directive: any): Promise<any> {
  // debug("Nothing in beforeWait but might be screencapture or ad checking");
  return Promise.resolve();
}

async function afterWait(page: puppeteer.Page, directive: any): Promise<any> {
  return Promise.resolve();
}

type TKHooks = DirectiveHooks<'tiktok.com', {}>;

interface TKHooksContext {
  profile: GuardoniProfile;
}

export type GetTKHooks = (ctx: TKHooksContext) => TKHooks;
export const GetTKHooks: GetTKHooks = (ctx) => {
  return {
    openURL: {
      beforeDirectives: (p) => beforeDirectives(p, ctx.profile),
      beforeLoad,
      beforeWait,
      afterWait,
      completed,
    },
    customs: {},
    DOMAIN_NAME: 'tiktok.com',
  };
};
