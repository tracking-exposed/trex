import { Hub } from '../hub';
import HubEvent from '../models/HubEvent';

// const bo = chrome;

function handleUnload(): void {
  // bo.runtime.sendMessage({ type: 'ReloadExtension' }, () =>
  //   log.info('reloading extension')
  // );
}

export function register(hub: Hub<HubEvent>): void {
  hub.on('WindowUnload', handleUnload);
}
