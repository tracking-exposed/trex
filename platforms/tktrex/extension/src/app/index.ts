import { boot } from '@shared/extension/app';
import { hub, registerTkHandlers } from '../handlers';
import { feedId, onLocationChange, tkHandlers, tkTrexActions } from './app';

// Boot the app script. This is the first function called.
boot({
  payload: {
    feedId,
    href: window.location.href,
  },
  mapLocalConfig: (c, p) => ({ ...c, ...p }),
  hub: {
    hub: hub,
    onRegister: (hub) => {
      registerTkHandlers(hub);
    },
  },
  observe: {
    handlers: tkHandlers,
    onLocationChange,
  },
  onAuthenticated: tkTrexActions,
});
