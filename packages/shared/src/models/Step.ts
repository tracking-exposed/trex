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

export const KeyPressType = t.literal('keypress');
export const KeypressStep = t.strict(
  {
    type: KeyPressType,
    key: t.string,
    times: t.union([t.number, t.undefined]),
    delay: t.union([t.number, t.undefined]),
    text: t.union([t.string, t.undefined]),
  },
  'KeypressStep'
);
// this is an hack to avoid a compile error due to
// key [string] not being compatible with [puppeteer.KeyInput]
export type KeypressStep = Omit<t.TypeOf<typeof KeypressStep>, 'key'> & {
  key: puppeteer.KeyInput;
};

export const ClickType = t.literal('click');
export const ClickStep = t.strict(
  {
    type: ClickType,
    selector: t.string,
    delay: t.union([t.number, t.undefined]),
  },
  'ClickStep'
);

export type ClickStep = t.TypeOf<typeof ClickStep>;

export const TypeType = t.literal('type');
export const TypeStep = t.strict(
  {
    type: TypeType,
    selector: t.string,
    text: t.string,
    delay: t.union([t.number, t.undefined]),
  },
  'TypeStep'
);

export type TypeStep = t.TypeOf<typeof TypeStep>;

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
    watchFor: t.union([t.number, t.string, t.undefined]),
    loadFor: t.union([t.number, t.string, t.undefined]),
    onCompleted: t.union([t.string, t.undefined]),
  },

  'OpenURLStep'
);

export type OpenURLStep = t.TypeOf<typeof OpenURLStep>;

export const Step = t.union(
  [
    ScrollStep,
    CustomStep,
    KeypressStep,
    ClickStep,
    TypeStep,
    // since `openURL` step is the default and the `type` can be `undefined`
    // the `OpenURLStep` codec needs to be the last value of the union
    OpenURLStep,
  ],
  'OpenURL'
);
export type Step = t.TypeOf<typeof Step>;
