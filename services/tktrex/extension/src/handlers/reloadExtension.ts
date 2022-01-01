import { Hub } from '../hub';
import log from '../logger';

const bo = chrome;

function handleReload(): void {
  bo.runtime.sendMessage(
    { type: 'ReloadExtension' },
    (response) => log.info('Reloading Extension'),
  );
}

export function register(hub: Hub): void {
  hub.on('WindowUnload', handleReload);
}
