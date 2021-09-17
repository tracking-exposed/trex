const bo = chrome || browser;

function handleReload(hub) {
  bo.runtime.sendMessage({ type: 'reloadExtension' }, (response) =>
    // eslint-disable-next-line no-console
    console.log('Reloading Extension')
  );
}

export function register(hub) {
  hub.register('windowUnload', handleReload.bind(null, hub));
}
