import * as express from 'express';
import { Logger } from '../../logger';

export const errorLogger: (l: Logger) => express.ErrorRequestHandler =
  (logger) => (err, req, res, next) => {
    if (err) {
      if (err.name === 'PayloadTooLargeError') {
        const errorData = {
          limit: err.limit,
          length: err.length,
          publicKey: req.headers['x-yttrex-publickey'],
        };
        logger.error(`%s: %O`, err.message);
        return res.status(413).send({ message: err.message, ...errorData });
      }
      return next(err);
    }
    return next();
  };
