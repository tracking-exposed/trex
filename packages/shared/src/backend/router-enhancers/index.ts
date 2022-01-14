import express from 'express';
import { RouteContext } from '../types';
import { MakeV0Routes } from './v0';

interface BackendContext extends RouteContext {}

export const makeBackend = (
  ctx: BackendContext,
  router: express.Router
): express.Router => {
  // bind v0 routes to router
  MakeV0Routes(router, ctx);

  return router;
};
