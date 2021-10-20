import { AuthResponse } from '@backend/models/Auth';
import { Keypair, Settings } from './Settings';

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

export interface BackgroundAuthResponse {
  type: 'auth';
  response: AuthResponse | undefined;
}

export interface BackgroundSettingsResponse {
  type: 'settings'
  response: Settings | undefined
}

export interface BackgroundKeypairResponse {
  type: 'keypair'
  response: Keypair | undefined
}

export type MessageResponse =
  | ServerLookupResponse
  | SyncResponse
  | BackgroundSettingsResponse
  | BackgroundAuthResponse;
