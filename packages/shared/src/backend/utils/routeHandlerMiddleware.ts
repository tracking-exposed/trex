import express from 'express';
import _ from 'lodash';
import { isAPIError } from '../../errors/APIError';
import { GetLogger } from '../../logger';

const logger = GetLogger('route-handler');

const logAPICount = { requests: {}, responses: {}, errors: {} };

function loginc(kind: string, fname: string): void {
  (logAPICount as any)[kind][fname] = (logAPICount as any)[kind][fname]
    ? (logAPICount as any)[kind][fname]++
    : 1;
}

type RouteHandlerMiddleware<R extends Record<string, express.RequestHandler>> =
  (
    fname: keyof R
  ) => (req: express.Request, res: express.Response) => Promise<void>;

export const routeHandleMiddleware = <
  R extends Record<string, express.RequestHandler>
>(
  apiList: R
): RouteHandlerMiddleware<R> => {
  setInterval(() => {
    let print = false;
    _.each(_.keys(logAPICount), function (k) {
      if (!_.keys((logAPICount as any)[k]).length)
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete (logAPICount as any)[k];
      else print = true;
    });
    if (print) logger.debug('%j', logAPICount);
    logAPICount.responses = {};
    logAPICount.errors = {};
    logAPICount.requests = {};
  }, 60 * 1000);

  return (fn) => async (req, res) => {
    const fname = fn as any;
    try {
      loginc('requests', fname);
      const funct = apiList[fname];
      const httpresult = await (funct as any)(req, res);

      if (!httpresult) {
        logger.debug("API (%s) didn't return anything!?", fname);
        loginc('errors', fname);
        res.send('Fatal error: Invalid output');
        res.status(501);
        return;
      }

      if (httpresult.json?.error) {
        const statusCode = httpresult.json.status ?? 500;
        logger.debug('API (%s) failure, returning %d', fname, statusCode);
        loginc('errors', fname);
        res.status(statusCode);
        res.json(httpresult.json);
        return;
      }

      if (httpresult.headers)
        _.each(httpresult.headers, function (value, key) {
          logger.debug('Setting header %s: %s', key, value);
          res.setHeader(key, value);
        });

      if (httpresult.json) {
        // logger("API (%s) success, returning %d bytes JSON", fname, _.size(JSON.stringify(httpresult.json)));
        loginc('responses', fname);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.json(httpresult.json);
      } else if (httpresult.text) {
        // logger("API (%s) success, returning text (size %d)", fname, _.size(httpresult.text));
        loginc('responses', fname);
        res.send(httpresult.text);
      } else if (httpresult.status) {
        // logger("Returning empty status %d from API (%s)", httpresult.status, fname);
        loginc('responses', fname);
        res.status(httpresult.status);
      } else {
        logger.debug(
          'Undetermined failure in API (%s) →  %j',
          fname,
          httpresult
        );
        loginc('errors', fname);
        res.status(502);
        res.send('Error?');
      }
    } catch (error) {
      logger.error('Route handler (%s) error: %O', fname, error);

      if (isAPIError(error)) {
        logger.error(
          'APIError - %s: (%s) %s %s',
          error.name,
          error.message,
          error.stack
        );
        res.status(error.status);
        res.send({
          name: error.name,
          message: error.message,
          details: error.details,
        });
      } else if (error instanceof Error) {
        logger.error('Error - %s: %s', error.name, error.message);
        logger.error(
          'Error in HTTP handler API(%s): %s %s',
          fname,
          error.message,
          error.stack
        );
        res.status(500).send('Software error: ' + error.message);
      } else {
        res.status(502);
        res.send('Software error: ' + (error as any).message);
        loginc('errors', fname);
        logger.debug('Error in HTTP handler API(%s): %o', fname, error);
      }
    }
    res.end();
  };
};
