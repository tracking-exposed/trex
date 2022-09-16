import { boot } from '@shared/extension/app';
import { tiktokDomainRegExp } from '@tktrex/parser/v2/constant';
import { registerTkHandlers } from './handlers';
import { feedId, onLocationChange, tkHandlers, tkTrexActions } from './app';
import { metadataLoggerProps } from '@tktrex/parser/metadata-logger';
import tkHub from '../handlers/hub';
import config from '@shared/extension/config';

// Boot the app script. This is the first function called.
void boot({
  payload: {
    feedId,
    href: window.location.href,
  },
  mapLocalConfig: (c, p) => ({ ...c, ...p }),
  hub: {
    hub: tkHub,
    onRegister: (hub, conf) => {
      registerTkHandlers(hub, conf);
    },
  },
  observe: {
    handlers: tkHandlers,
    platformMatch: tiktokDomainRegExp,
    onLocationChange,
  },
  onAuthenticated: tkTrexActions,
  ui: config.DEVELOPMENT ? {
    metadataLogger: metadataLoggerProps,
  }: undefined,
});
