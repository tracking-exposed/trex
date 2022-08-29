import { UserSettings } from './UserSettings';

interface MessageBase {
  type: Message['type'];
}

export interface SettingsLookup extends MessageBase {
  type: 'SettingsLookup';
  payload: {
    userId: string;
  };
}

export interface LocalLookup extends MessageBase {
  type: 'LocalLookup';
  payload: {
    userId: string;
  };
}

export interface ServerLookup extends MessageBase {
  type: 'ServerLookup';
  payload: {
    feedId: string;
    href: string;
  };
}

export interface ConfigUpdate extends MessageBase {
  type: 'ConfigUpdate';
  payload: Partial<UserSettings>;
}

export interface ReloadExtension extends MessageBase {
  type: 'ReloadExtension';
}

export interface Sync extends MessageBase {
  type: 'sync';
}

export interface APISync extends MessageBase {
  type: 'apiSync'
}

export type Message =
  | SettingsLookup
  | LocalLookup
  | ServerLookup
  | ConfigUpdate
  | ReloadExtension
  | Sync
  | APISync
