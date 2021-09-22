import { AccountSettings } from './AccountSettings';

export type SyncResponse =
  | {
      type: 'syncResponse';
      response: any;
    }
  | {
      type: 'syncError';
      response: chrome.runtime.LastError;
    };

export type ServerLookupResponse =
  | {
      type: 'handshakeResponse';
      response: any;
    }
  | {
      type: 'handshakeError';
      response: chrome.runtime.LastError;
    };

export type MessageResponse =
  | ServerLookupResponse
  | SyncResponse
  | AccountSettings;
