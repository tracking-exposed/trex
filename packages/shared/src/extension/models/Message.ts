import { UserSettings } from './UserSettings';

interface MessageBase {
  type: Message['type'];
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

export type Message =
  | LocalLookup
  | ServerLookup
  | ConfigUpdate
  | ReloadExtension;
