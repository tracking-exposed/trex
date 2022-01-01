import config from '../config';

import { register as syncRegister } from './sync';
import { register as loggerRegister } from './logger';
import { register as reloadRegister } from './reloadExtension';
import { Hub } from '../hub';

export function registerHandlers(hub: Hub): void {
  syncRegister(hub);
  loggerRegister(hub);

  if (config.DEVELOPMENT) {
    reloadRegister(hub);
  }
}
