import { AuthResponse } from '@backend/models/Auth';
import * as t from 'io-ts';
import { Settings } from './Settings';

export const ServerLookup = t.literal('serverLookup');
export const GetKeypair = t.literal('GetKeypair');
export const GenerateKeypair = t.literal('GenerateKeypair');
export const DeleteKeypair = t.literal('DeleteKeypair');
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
    GetKeypair,
    GenerateKeypair,
    DeleteKeypair,
    ServerLookup,
    RecommendationsFetch,
    ReloadExtension,
  ],
  'MessageType'
);

export type MessageType = t.TypeOf<typeof MessageType>;

export const MessageRequest = t.union(
  [
    // keypair
    t.strict({ type: GenerateKeypair }),
    t.strict({ type: GetKeypair }),
    t.strict({ type: DeleteKeypair }),
    // settings
    t.strict({ type: GetSettings }),
    t.strict({ type: UpdateSettings, payload: Settings }),
    // content creator auth
    t.strict({ type: GetAuth }),
    t.strict({
      type: UpdateAuth,
      payload: t.union([AuthResponse, t.undefined]),
    }),
    t.strict({ type: RecommendationsFetch, payload: t.any }),
    t.strict({ type: ReloadExtension }),
    t.strict({ type: ServerLookup }),
  ],
  'MessageRequest'
);
export type MessageRequest = t.TypeOf<typeof MessageRequest>;
