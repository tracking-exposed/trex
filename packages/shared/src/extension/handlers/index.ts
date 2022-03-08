import config from '../config';

import { register as apiSyncRegister } from './apiSync';
import { register as loggerRegister } from './logger';
import { register as reloadRegister } from './reloadExtension';
import { Hub } from '../hub';
import HubEvent from '../models/HubEvent';

export function registerHandlers(hub: Hub<HubEvent>): void {
  apiSyncRegister(hub);
  loggerRegister(hub);

  if (config.DEVELOPMENT) {
    reloadRegister(hub);
  }
}
