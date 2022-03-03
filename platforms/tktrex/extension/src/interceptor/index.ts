import { Json } from 'fp-ts/lib/Json';
import log from '@shared/extension/logger';
import { INTERCEPTED_ITEM_CLASS, INTERCEPTOR_CONTAINER_ID } from './constants';
import { APIHandler, listHandler, recommendedListHandler } from './handlers';

const iLog = log.extend('intercept');

interface TrExXMLHttpPRequest extends XMLHttpRequest {
  _method: string;
  _startTime: Date;
  _requestHeaders: any;
  _endTime?: Date;
}

interface Datum {
  id: string;
  url: string;
  request: {
    method: string;
    query?: any;
    params?: any;
    headers: any;
    body?: Json;
  };

  response: {
    headers: any;
    status: number;
    body: Json;
  };
}

/**
 * parse xhr response to a consistent data type
 */
const parseData = (
  xhr: TrExXMLHttpPRequest,
  { api, postData }: { api: APIHandler; postData: any },
): Datum => {
  iLog.debug('API handler %O', api);
  iLog.debug('XHR %O', xhr);
  iLog.debug('Post Data %O', JSON.parse(postData));
  const id = `${xhr._startTime}_${xhr._endTime}`;
  // handle POST requests

  iLog.debug('POST request: %O', xhr);
  return {
    id,
    url: api.urls[0],
    request: {
      method: api.method,
      query: undefined,
      params: undefined,
      headers: xhr._requestHeaders,
      body: xhr._method === 'POST' ? JSON.parse(postData) : undefined,
    },
    response: {
      headers: xhr.getAllResponseHeaders(),
      status: xhr.status,
      body: JSON.parse(xhr.responseText),
    },
  };
};

export const getOrCreateInterceptorContainer = (): HTMLDivElement => {
  const existingContainer = document.body.querySelector(
    `#${INTERCEPTOR_CONTAINER_ID}`,
  );
  if (existingContainer) {
    return existingContainer as HTMLDivElement;
  }

  const interceptorContainer = document.createElement('div');
  interceptorContainer.id = INTERCEPTOR_CONTAINER_ID;
  interceptorContainer.style.visibility = 'hidden';
  interceptorContainer.style.height = '0px';
  interceptorContainer.style.width = '0px';
  interceptorContainer.style.position = 'fixed';
  return interceptorContainer;
};

export default (function(xhr) {
  const XHR = XMLHttpRequest.prototype;

  const open = XHR.open;
  const send = XHR.send;
  const setRequestHeader = XHR.setRequestHeader;

  const interceptorContainer = getOrCreateInterceptorContainer();

  document.body.appendChild(interceptorContainer);
  iLog.debug('Interceptor container: %O', interceptorContainer);

  XHR.open = function(method, url) {
    (this as any)._method = method;
    (this as any)._url = url;
    (this as any)._requestHeaders = {};
    (this as any)._startTime = new Date().toISOString();

    return open.apply(this, arguments as any);
  };

  XHR.setRequestHeader = function(header, value) {
    (this as any)._requestHeaders[header] = value;
    return setRequestHeader.apply(this, arguments as any);
  };

  XHR.send = function(postData) {
    this.addEventListener('load', function() {
      (this as any)._endTime = new Date().toISOString();

      iLog.debug(
        'Loading request %s: %s',
        (this as any)._method,
        (this as any)._url,
      );

      // get array of data to convert to DOM nodes
      const caughtData = [listHandler, recommendedListHandler].reduce<Datum[]>(
        (acc, h) => {
          // check the current request match api handler
          const urlMatch =
            h.urls.some((u) => (this as any)._url.includes(u)) &&
            (this as any)._method === h.method;

          if (urlMatch) {
            return acc.concat(
              parseData(this as TrExXMLHttpPRequest, { api: h, postData }),
            );
          }
          return acc;
        },
        [],
      );

      iLog.debug('Nodes with results %O', caughtData);

      caughtData
        .map((d) => {
          // create a DOM element containing the data
          const datumNode = document.createElement('div');
          datumNode.id = d.id;
          datumNode.className = INTERCEPTED_ITEM_CLASS;
          datumNode.innerHTML = JSON.stringify(d);
          return datumNode;
        })
        .forEach((n) => {
          // append element to interceptor container,
          // the app.ts will take care of remove the nodes
          // once processed
          interceptorContainer.appendChild(n);
        });
    });

    return send.apply(this, arguments as any);
  };
})(XMLHttpRequest);
