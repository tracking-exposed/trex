import { Hub } from '../hub';
import log from '../logger';
import HubEvent from '../models/HubEvent';

export function register(hub: Hub<HubEvent>): void {
  hub.onAnyEvent(({ type, payload }) => {
    log.info(`event "${type}" triggered`);
    // log.debug(`payload for %s event: %O`, type, payload);
  });
}
