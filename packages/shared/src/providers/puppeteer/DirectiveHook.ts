import * as puppeteer from 'puppeteer-core';
import { OpenURLDirective } from '../../models/Directive';

export type HookHandler = (
  page: puppeteer.Page,
  directive: any,
  options?: any
) => Promise<any>;

export interface DirectiveHooks<
  DO extends string,
  CS extends {
    [key: string]: HookHandler;
  }
> {
  openURL: {
    beforeDirectives: (page: puppeteer.Page) => Promise<void>;
    beforeLoad: (
      page: puppeteer.Page,
      directive: OpenURLDirective
    ) => Promise<void>;
    beforeWait: (
      page: puppeteer.Page,
      directive: OpenURLDirective
    ) => Promise<void>;
    afterWait: (
      page: puppeteer.Page,
      directive: OpenURLDirective
    ) => Promise<void>;
    completed: () => Promise<string>;
  };
  customs?: CS;
  DOMAIN_NAME: DO;
}
