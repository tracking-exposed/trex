import { AuthResponse } from '@backend/models/Auth';
import * as t from 'io-ts';
import { Settings } from './AccountSettings';

export const ServerLookup = t.literal('serverLookup');
export const GetSettings = t.literal('GetSettings');
export const UpdateSettings = t.literal('UpdateSettings');
export const RecommendationsFetch = t.literal('recommendationsFetch');
export const ReloadExtension = t.literal('ReloadExtension');
export const GetAuth = t.literal('GetAuth');
export const UpdateAuth = t.literal('UpdateAuth');

export const MessageType = t.union(
  [
    GetSettings,
    UpdateSettings,
    ServerLookup,
    RecommendationsFetch,
    ReloadExtension,
  ],
  'MessageType'
);

export type MessageType = t.TypeOf<typeof MessageType>;

export const MessageRequest = t.union(
  [
    t.strict({ type: GetSettings }),
    t.strict({ type: ServerLookup }),
    t.strict({ type: UpdateSettings, payload: Settings }),
    t.strict({ type: RecommendationsFetch, payload: t.any }),
    t.strict({ type: ReloadExtension }),
    t.strict({ type: GetAuth }),
    t.strict({
      type: UpdateAuth,
      payload: t.union([AuthResponse, t.undefined]),
    }),
  ],
  'MessageRequest'
);
export type MessageRequest = t.TypeOf<typeof MessageRequest>;
