import * as t from 'io-ts';
import { DateFromISOString } from 'io-ts-types';
import type * as puppeteer from 'puppeteer-core';
// todo: this should be named CreateExperimentBody

export const PostDirectiveSuccessResponse = t.strict(
  {
    status: t.union([t.literal('exist'), t.literal('created')]),
    experimentId: t.string,
    since: t.union([DateFromISOString, t.undefined]),
  },
  'PostDirectiveSuccessResponse'
);

export type PostDirectiveSuccessResponse = t.TypeOf<
  typeof PostDirectiveResponse
>;

export const PostDirectiveResponse = t.union(
  [
    t.type({ error: t.type({ message: t.string }) }),
    PostDirectiveSuccessResponse,
  ],
  'PostDirectiveResponse'
);

export const CreateDirectiveBody = t.any;

export const ComparisonDirectiveType = t.literal('comparison');
export const SearchDirectiveType = t.literal('search');
export const DirectiveType = t.union(
  [ComparisonDirectiveType, SearchDirectiveType],
  'DirectiveType'
);
export type DirectiveType = t.TypeOf<typeof DirectiveType>;

export const ScrollForDirectiveType = t.literal('scroll');
export const ScrollForDirective = t.strict(
  {
    type: ScrollForDirectiveType,
    incrementScrollByPX: t.number,
    totalScroll: t.number,
    interval: t.union([t.number, t.undefined]),
  },
  'ScrollForDirective'
);
export type ScrollForDirective = t.TypeOf<typeof ScrollForDirective>;

export const CustomDirectiveType = t.literal('custom');
export type CustomDirectiveType = t.TypeOf<typeof CustomDirectiveType>;

export const CustomDirective = t.strict(
  {
    type: CustomDirectiveType,
    handler: t.string,
  },
  'CustomDirective'
);
export interface CustomDirective {
  type: CustomDirectiveType;
  handler: (page: puppeteer.Page, directive: CustomDirective) => Promise<any>;
}

// export const DirectiveHook = t.union(
//   [CustomDirective, ScrollForDirective],
//   'DirectiveHook'
// );
// export type DirectiveHook = t.TypeOf<typeof DirectiveHook>;

// export const DirectiveHooksMap = t.partial(
//   {
//     beforeLoad: t.array(DirectiveHook),
//     beforeWait: t.array(DirectiveHook),
//     afterWait: t.array(DirectiveHook),
//     completed: t.array(DirectiveHook),
//   },
//   'DirectiveOptions'
// );
// export type DirectiveHooksMap = t.TypeOf<typeof DirectiveHooksMap>;

export const OpenURLDirectiveType = t.literal('openURL');
export const OpenURLDirective = t.strict(
  {
    type: t.union([OpenURLDirectiveType, t.undefined]),
    title: t.union([t.string, t.undefined]),
    url: t.string,
    urltag: t.union([t.string, t.undefined]),
    watchFor: t.union([ t.number, t.string, t.undefined]),
    loadFor: t.union([t.number, t.string, t.undefined]),
  },

  'OpenURLDirective'
);

export type OpenURLDirective = t.TypeOf<typeof OpenURLDirective>;

export const Directive = t.union(
  [ScrollForDirective, CustomDirective, OpenURLDirective],
  'Directive'
);
export type Directive = t.TypeOf<typeof Directive>;
