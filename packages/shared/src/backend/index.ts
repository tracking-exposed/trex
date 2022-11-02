import express from 'express';
import { RouteContext } from './types';

interface BackendContext extends RouteContext {}

export const makeBackend = (
  ctx: BackendContext,
  router: express.Router
): express.Router => {
  // bind v0 routes to router

  /* this API is v0 as it is platform neutral.
   */
  router.get('/v0/health', function (req, res) {
    // count collections in db
    void ctx.db.listCollections(ctx.db.mongo).then((collections) => {
      res.send({
        status: 'success',
        data: {
          collections: collections.length,
        },
      });

      res.status(200);
    });
  });

  return router;
};
