import * as t from 'io-ts';

export interface GuardoniConfig {
  headless: boolean;
  verbose: boolean;
  profileName?: string;
  evidenceTag?: string;
  advScreenshotDir?: string;
  proxy?: string;
  backend?: string;
  basePath?: string;
  extensionDir?: string;
  excludeURLTag?: string[];
  chromePath?: string;
  loadFor?: number;
}

export type GuardoniConfigRequired = Omit<
  GuardoniConfig,
  'basePath' | 'profile' | 'backend' | 'evidenceTag' | 'extensionDir'
> & {
  profileName: string;
  backend: string;
  basePath: string;
  evidenceTag: string;
  extensionDir: string;
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
  values: Record<string, any>;
}

export type GuardoniOutput = GuardoniErrorOutput | GuardoniSuccessOutput;

export const GuardoniProfile = t.strict(
  {
    udd: t.string,
    profileName: t.string,
    newProfile: t.boolean,
    extensionDir: t.string,
    execount: t.number,
    evidencetag: t.array(t.string),
  },
  'Profile'
);

export type GuardoniProfile = t.TypeOf<typeof GuardoniProfile>;
