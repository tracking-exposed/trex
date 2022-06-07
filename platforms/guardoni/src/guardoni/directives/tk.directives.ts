import { DirectiveHooks } from '@shared/providers/puppeteer/DirectiveHook';
import { tkLogin } from '@tktrex/shared/methodology/directives/tiktokLogin.directive';
import * as puppeteer from 'puppeteer-core';
import { GuardoniProfile } from '../types';

async function beforeDirectives(
  page: puppeteer.Page,
  directive: any
): Promise<any> {
  return Promise.resolve();
}

async function beforeLoad(page: puppeteer.Page, directive: any): Promise<any> {
  return Promise.resolve();
}

async function completed(): Promise<any> {
  return Promise.resolve();
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
    customs: {
      tiktokLogin: tkLogin
    },
    DOMAIN_NAME: 'tiktok.com',
  };
};
