import { boot } from '@shared/extension/app';
import { tiktokDomainRegExp } from '@tktrex/parser/constant';
import { hub, registerTkHandlers } from '../handlers';
import { feedId, onLocationChange, tkHandlers, tkTrexActions } from './app';

// Boot the app script. This is the first function called.
void boot({
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
    platformMatch: tiktokDomainRegExp,
    onLocationChange,
  },
  onAuthenticated: tkTrexActions,
});
