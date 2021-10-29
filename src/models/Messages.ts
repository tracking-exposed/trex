import { AuthResponse } from '@backend/models/Auth';
import { ContentCreator } from '@backend/models/ContentCreator';
import { pipe } from 'fp-ts/lib/pipeable';
import * as R from 'fp-ts/lib/Record';
import * as t from 'io-ts';
import { Keypair, Settings } from './Settings';

// keypair
export const GetKeypair = t.literal('GetKeypair');
export const GenerateKeypair = t.literal('GenerateKeypair');
export const DeleteKeypair = t.literal('DeleteKeypair');
export const GetSettings = t.literal('GetSettings');
export const UpdateSettings = t.literal('UpdateSettings');
export const ReloadExtension = t.literal('ReloadExtension');
export const GetAuth = t.literal('GetAuth');
export const UpdateAuth = t.literal('UpdateAuth');
export const GetContentCreator = t.literal('GetContentCreator');
export const UpdateContentCreator = t.literal('UpdateContentCreator');
export const Update = t.literal('update');
export const ErrorOccured = t.literal('ErrorOccured');

// unused
export const RecommendationsFetch = t.literal('recommendationsFetch');
export const ServerLookup = t.literal('serverLookup');

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
    GetContentCreator,
    UpdateContentCreator,
    ErrorOccured,
  ],
  'MessageType'
);

export interface MessageType<K extends string, P = unknown, R = unknown> {
  type: K;
  payload: P;
  response: R;
}

interface MessageResponse<K extends string, P = unknown> {
  type: K;
  response: P;
}

interface MessageRequest<K extends string, R = unknown> {
  type: K;
  payload?: R;
}

export type MessagesAPI<
  A extends { [key: string]: Omit<MessageType<typeof key, any, any>, 'type'> }
> = {
  [K in keyof A]: K extends string
    ? {
        Request: MessageRequest<K, A[K]['payload']['_A']>;
        Response: MessageResponse<K, A[K]['response']['_A']>;
      }
    : never;
};

const MessagesAPI = <
  A extends { [key: string]: Omit<MessageType<typeof key, any, any>, 'type'> }
>(
  defs: A
): MessagesAPI<A> => {
  return pipe(
    defs,
    R.mapWithIndex<string, MessageType<any, any>, any>((l, m) => ({
      Request: {
        type: l,
        payload: m.payload,
      },
      Response: {
        type: l,
        response: m.response,
      },
    })) as any
  );
};

export const Messages = MessagesAPI({
  // keypair
  [GenerateKeypair.value]: { payload: t.void, response: Keypair },
  [GetKeypair.value]: { payload: t.void, response: Keypair },
  [DeleteKeypair.value]: { payload: t.void, response: t.undefined },
  // settings
  [GetSettings.value]: {
    payload: t.void,
    response: t.union([Settings, t.undefined]),
  },
  [UpdateSettings.value]: { payload: Settings, response: Settings },
  // content creator auth
  [GetAuth.value]: {
    payload: t.void,
    response: t.union([AuthResponse, t.null]),
  },
  [UpdateAuth.value]: {
    payload: t.union([AuthResponse, t.null]),
    response: AuthResponse,
  },
  [GetContentCreator.value]: {
    payload: t.void,
    response: t.union([ContentCreator, t.null]),
  },

  [UpdateContentCreator.value]: {
    payload: t.union([ContentCreator, t.null]),
    response: ContentCreator,
  },
  [RecommendationsFetch.value]: { payload: t.any, response: t.any },
  [ReloadExtension.value]: { payload: t.any, response: t.undefined },
  [ServerLookup.value]: { payload: t.any, response: t.undefined },
  [ErrorOccured.value]: { payload: t.any, response: t.any },
});

export type Messages = typeof Messages;
