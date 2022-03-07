import { Hub } from '../hub';
import log from '../logger';

const bo = chrome;

function handleReload(): void {
  bo.runtime.sendMessage({ type: 'ReloadExtension' }, () =>
    log.info('reloading extension')
  );
}

export function register(hub: Hub): void {
  hub.on('WindowUnload', handleReload);
}
