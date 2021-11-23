function eventHandler(type, e) {
  // eslint-disable-next-line no-console
  console.debug(type, e);
}

export function register(hub) {
  hub.register('*', eventHandler);
}
