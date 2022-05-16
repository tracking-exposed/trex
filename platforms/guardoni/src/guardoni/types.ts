import * as endpoints  from '@shared/endpoints';
import { Logger } from '@shared/logger';
import { DirectiveType } from '@shared/models/Directive';
import { APIClient } from '@shared/providers/api.provider';
import * as t from 'io-ts';
import type puppeteer from 'puppeteer-core';

export const Platform = t.union(
  [t.literal('youtube'), t.literal('tiktok')],
  'Platform'
);
export type Platform = t.TypeOf<typeof Platform>;

export const PlatformConfig = t.strict(
  {
    name: Platform,
    backend: t.string,
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

export const GuardoniPlatformConfig = t.strict(
  {
    name: t.union([t.literal('tiktok'), t.literal('youtube')]),
    backend: t.string,
    extensionDir: t.string,
    proxy: t.union([t.string, t.undefined]),
  },
  'GuardoniPlatformConfig'
);

export type GuardoniPlatformConfig = t.TypeOf<typeof GuardoniPlatformConfig>;

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
  puppeteer: typeof puppeteer;
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
