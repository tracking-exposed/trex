import { Router } from 'express';
import { RouteContext } from '../types';

import routeCreators from '../route-creators/automation/automation.v0.routes';

export const addTikTokRoutes = (fk: RouteContext, ctx: Router): Router => {
  for (const routeCreator of routeCreators) {
    routeCreator(ctx, fk);
  }

  return ctx;
};

export default addTikTokRoutes;
