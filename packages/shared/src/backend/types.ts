import { Router } from 'express';
import * as logger from '../logger';
import DBClient from '../providers/db.provider';

export interface RouteContext {
  db: DBClient;
  logger: logger.Logger;
}

export type Route = (r: Router, ctx: RouteContext) => void;
