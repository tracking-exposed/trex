import { boot } from '@shared/extension/app';
import { tiktokDomainRegExp } from '@tktrex/parser/v2/constant';
import tkHub, { registerTkHandlers } from './hub/index';
import { feedId, onLocationChange, tkHandlers, tkTrexActions } from './app';

// Boot the app script. This is the first function called.
void boot({
  payload: {
    feedId,
    href: window.location.href,
  },
  mapLocalConfig: (c, p) => ({ ...c, ...p }),
  hub: {
    hub: tkHub,
    onRegister: (hub, config) => {
      registerTkHandlers(hub, config);
    },
  },
  observe: {
    handlers: tkHandlers,
    platformMatch: tiktokDomainRegExp,
    onLocationChange,
  },
  onAuthenticated: tkTrexActions,
  ui: {
    common: {
      errors: true,
    },
  },
});
