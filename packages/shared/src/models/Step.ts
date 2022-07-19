import * as t from 'io-ts';
import type * as puppeteer from 'puppeteer-core';
// todo: this should be named CreateExperimentBody

export const ScrollStepType = t.literal('scroll');
export const ScrollStep = t.strict(
  {
    type: ScrollStepType,
    incrementScrollByPX: t.number,
    totalScroll: t.number,
    interval: t.union([t.number, t.undefined]),
  },
  'ScrollStep'
);
export type ScrollStep = t.TypeOf<typeof ScrollStep>;

export const CustomStepType = t.literal('custom');
export type CustomStepType = t.TypeOf<typeof CustomStepType>;

export const CustomStep = t.strict(
  {
    type: CustomStepType,
    handler: t.string,
  },
  'CustomStep'
);
export interface CustomStep {
  type: CustomStepType;
  handler: (page: puppeteer.Page, step: CustomStep) => Promise<any>;
}

export const OpenURLStepType = t.literal('openURL');
export const OpenURLStep = t.strict(
  {
    type: t.union([OpenURLStepType, t.undefined]),
    title: t.union([t.string, t.undefined]),
    url: t.string,
    urltag: t.union([t.string, t.undefined]),
    watchFor: t.union([ t.number, t.string, t.undefined]),
    loadFor: t.union([t.number, t.string, t.undefined]),
  },

  'OpenURLStep'
);

export type OpenURLStep = t.TypeOf<typeof OpenURLStep>;

export const Step = t.union(
  [ScrollStep, CustomStep, OpenURLStep],
  'OpenURL'
);
export type Step = t.TypeOf<typeof Step>;
