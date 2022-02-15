/* eslint-disable no-eval */
import { bo } from '@shared/utils/browser.utils';
import log from '../../logger';

const xhrLog = log;

interface XHRInterceptor {
  listen: () => void;
}

interface XHRInterceptorContext {
  browser: typeof bo;
  api: Array<{
    urls: string[];
    method: 'GET' | 'POST';
    handler: (data: any) => void;
  }>;
}

const GetXHRInterceptor = ({ api }: XHRInterceptorContext): XHRInterceptor => {
  xhrLog.debug('Starting XHR interceptor for api %O', api);

  const networkFilters: chrome.webRequest.RequestFilter = {
    urls: ['https://*.tiktok.com/*'],
    types: ['xmlhttprequest', 'beacon' as any],
  };
  console.log(networkFilters);

  return {
    listen: () => {
      bo.webRequest.onBeforeRequest.addListener(
        (details) => {
          console.log('before request', details);
        },
        networkFilters,
        ['requestBody', 'blocking']
      );

      bo.webRequest.onResponseStarted.addListener((details) => {
        console.log('response started', details);
      }, networkFilters);

      bo.webRequest.onCompleted.addListener((details) => {
        console.log('response completed', details);
      }, networkFilters);
    },
  };
};

const xhrInterceptor = GetXHRInterceptor({
  browser: chrome,
  api: [
    {
      urls: ['/v1/list'],
      method: 'POST',
      handler: (data: any) => {
        console.log('data from list', data);
      },
    },
    {
      urls: ['/api/post/item_list/', '/api/recommend/item_list/'],
      method: 'GET',
      handler: (data: any) => {
        console.log('data from recommended item', data);
      },
    },
  ],
});

xhrInterceptor.listen();
