import express from 'express';
import { RouteContext } from './types';

interface BackendContext extends RouteContext {}

export const makeBackend = (
  ctx: BackendContext,
  router: express.Router
): express.Router => {
  // bind v0 routes to router

  return router;
};
