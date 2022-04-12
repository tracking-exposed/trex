import * as t from 'io-ts';
import { Platform } from '../electron/app/Header';

export interface PlatformConfig {
  name: Platform;
  backend?: string;
  extensionDir?: string;
  proxy?: string;
}

export interface GuardoniConfig {
  headless: boolean;
  verbose: boolean;
  profileName?: string;
  evidenceTag?: string;
  advScreenshotDir?: string;
  basePath?: string;
  excludeURLTag?: string[];
  chromePath?: string;
  loadFor?: number;
  publicKey?: string;
  yt?: PlatformConfig;
  tk?: PlatformConfig;
}

export type GuardoniConfigRequired = Omit<
  GuardoniConfig,
  | 'basePath'
  | 'profile'
  | 'backend'
  | 'evidenceTag'
  | 'extensionDir'
  | 'publicKey'
  | 'tk'
  | 'yt'
> & {
  profileName: string;
  publicKey: string;
  basePath: string;
  evidenceTag: string;
  platform: Omit<Required<PlatformConfig>, 'proxy'> & { proxy?: string };
  loadFor: number;
  chromePath: string;
};

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
