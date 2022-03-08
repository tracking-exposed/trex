import { Hub } from '../hub';
import log from '../logger';
import HubEvent from '../models/HubEvent';

export function register(hub: Hub<HubEvent>): void {
  hub.onAnyEvent(({ type, payload }) => {
    log.debug(`event "${type}" triggered on hub with payload %O`, payload);
  });
}
