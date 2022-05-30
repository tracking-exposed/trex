import * as endpoints from '@shared/endpoints';
import { Logger } from '@shared/logger';
import {
  SearchDirective,
  SearchDirectiveType,
} from '@tktrex/shared/models/directive/SearchDirective';
import {
  ComparisonDirectiveRow,
  ComparisonDirectiveType,
} from '@yttrex/shared/models/Directive';
import { APIClient } from '@shared/providers/api.provider';
import { pipe } from 'fp-ts/lib/function';
import * as R from 'fp-ts/lib/Record';
import * as t from 'io-ts';
import { nonEmptyArray } from 'io-ts-types';
import { PuppeteerExtra } from 'puppeteer-extra';

export const Platform = t.union(
  [t.literal('youtube'), t.literal('tiktok')],
  'Platform'
);
export type Platform = t.TypeOf<typeof Platform>;

export const PlatformConfig = t.strict(
  {
    name: Platform,
    backend: t.string,
    frontend: t.union([t.string, t.undefined]),
    extensionDir: t.string,
    proxy: t.union([t.string, t.undefined]),
  },
  'PlatformConfig'
);

export type PlatformConfig = t.TypeOf<typeof PlatformConfig>;

export const GuardoniConfig = t.strict(
  {
    chromePath: t.string,
    basePath: t.string,
    headless: t.boolean,
    verbose: t.boolean,
    profileName: t.string,
    evidenceTag: t.string,
    loadFor: t.number,
    advScreenshotDir: t.union([t.string, t.undefined]),
    excludeURLTag: t.union([t.string, t.undefined]),
    yt: PlatformConfig,
    tk: PlatformConfig,
  },
  'GuardoniConfig'
);

export type GuardoniConfig = t.TypeOf<typeof GuardoniConfig>;

export interface ProgressDetails {
  message: string;
  details: string[];
}

export interface GuardoniErrorOutput {
  type: 'error';
  message: string;
  details: string[];
}

export interface GuardoniSuccessOutput {
  type: 'success';
  message: string;
  values: Array<Record<string, any>>;
}

export type GuardoniOutput = GuardoniErrorOutput | GuardoniSuccessOutput;

export const GuardoniProfile = t.strict(
  {
    udd: t.string,
    profileName: t.string,
    newProfile: t.boolean,
    execount: t.number,
    evidencetag: t.array(t.string),
  },
  'Profile'
);

export type GuardoniProfile = t.TypeOf<typeof GuardoniProfile>;

export interface GuardoniContext {
  puppeteer: PuppeteerExtra;
  API: APIClient<typeof endpoints>;
  config: GuardoniConfig;
  platform: PlatformConfig;
  profile: GuardoniProfile;
  guardoniConfigFile: string;
  logger: Pick<Logger, 'info' | 'error' | 'debug'>;
  version: string;
}

export interface ExperimentInfo {
  experimentId: string;
  evidenceTag: string;
  directiveType: DirectiveType;
  execCount: number;
  profileName: string;
  newProfile: boolean;
  when: Date;
}

export const Directive = t.union(
  [ComparisonDirectiveRow, SearchDirective],
  'DirectiveRow'
);
export type Directive = t.TypeOf<typeof Directive>;

export const CreateDirectiveBody = t.union(
  [
    t.type({ parsedCSV: nonEmptyArray(Directive) }),
    nonEmptyArray(SearchDirective),
  ],
  'CreateDirectiveBody'
);

const directiveKeysMap = pipe(
  { search: SearchDirective, comparison: ComparisonDirectiveRow },
  R.map((type) => nonEmptyArray(type))
);

export const DirectiveKeysMap = t.type(directiveKeysMap, 'DirectiveKeysMap');

export const DirectiveType = t.union(
  [ComparisonDirectiveType, SearchDirectiveType],
  'DirectiveType'
);
export type DirectiveType = t.TypeOf<typeof DirectiveType>;
