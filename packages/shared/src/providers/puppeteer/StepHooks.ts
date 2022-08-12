import * as puppeteer from 'puppeteer-core';
import { OpenURLStep } from '../../models/Step';

type Hook = (page: puppeteer.Page, step: any, opts?: any) => Promise<any>;
export interface StepHooks<
  DO extends string,
  CS extends {
    [key: string]: Hook;
  }
> {
  openURL: {
    beforeDirectives: (page: puppeteer.Page) => Promise<void>;
    beforeLoad: (
      page: puppeteer.Page,
      step: OpenURLStep
    ) => Promise<void>;
    beforeWait: (
      page: puppeteer.Page,
      step: OpenURLStep
    ) => Promise<void>;
    afterWait: (
      page: puppeteer.Page,
      step: OpenURLStep
    ) => Promise<void>;
    completed: () => Promise<string>;
  };
  customs?: CS;
  DOMAIN_NAME: DO;
}
