import { Router } from 'express';
import { MakeHealthRoute } from './routes/health/health.v0.route';
import { RouteContext } from './types';

export const MakeV0Routes = (router: Router, ctx: RouteContext): void => {
  MakeHealthRoute(router, ctx);
};
