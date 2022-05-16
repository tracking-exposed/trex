import { Hub } from '../hub';
import log from '../logger';
import HubEvent from '../models/HubEvent';

const bo = chrome;

function handleReload(): void {
  bo.runtime.sendMessage({ type: 'ReloadExtension' }, () =>
    log.info('reloading extension')
  );
}

export function register(hub: Hub<HubEvent>): void {
  hub.on('WindowUnload', handleReload);
}
