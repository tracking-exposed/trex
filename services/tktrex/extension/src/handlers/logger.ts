import { Hub } from '../hub';
import log from '../logger';

export function register(hub: Hub): void {
  hub.onAnyEvent(({ type, payload }) => {
    log.info(
      `event "${type}" triggered on hub with payload`,
      payload,
    );
  });
}
