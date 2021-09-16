/// <reference types="react-scripts" />

declare namespace NodeJS {
  interface ProcessEnv {
    readonly NODE_ENV: 'development' | 'production' | 'test';
    readonly PUBLIC_URL: string;
    readonly REACT_APP_API_URL: string;
    readonly REACT_APP_BUILD_TARGET: 'extension' | 'web-app';
    readonly REACT_APP_BUNDLE_STATS: boolean;
  }
}
