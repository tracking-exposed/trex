// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference types="react-scripts" />

declare namespace NodeJS {
  interface ProcessEnv {
    readonly NODE_ENV: 'development' | 'production' | 'test';
    readonly PUBLIC_URL: string;
    readonly REACT_APP_API_URL: string;
    readonly REACT_APP_WEB_URL: string;
    readonly REACT_APP_VERSION: string;
    readonly REACT_APP_BUILD_DATE: string;
    readonly REACT_APP_LOGGER: string;
  }
}
