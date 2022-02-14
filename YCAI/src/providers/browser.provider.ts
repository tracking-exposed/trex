import {
  GetBrowserProvider,
  APIRequest,
  ErrorOccurred,
  MessagesAPI,
} from '@shared/providers/browser.provider';
import { AuthResponse } from '@shared/models/Auth';
import { ContentCreator } from '@shared/models/ContentCreator';
import { Keypair } from '@shared/models/extension/Keypair';
import * as t from 'io-ts';
import { OptInNudgeStatus, Settings } from '../models/Settings';

export { APIRequest, ErrorOccurred };

// keypair
export const GetKeypair = t.literal('GetKeypair');
export const GenerateKeypair = t.literal('GenerateKeypair');
export const DeleteKeypair = t.literal('DeleteKeypair');
// settings
export const GetSettings = t.literal('GetSettings');
export const UpdateSettings = t.literal('UpdateSettings');

// content creator
export const GetAuth = t.literal('GetAuth');
export const UpdateAuth = t.literal('UpdateAuth');
export const GetContentCreator = t.literal('GetContentCreator');
export const UpdateContentCreator = t.literal('UpdateContentCreator');

// unused
export const ReloadExtension = t.literal('ReloadExtension');
export const Update = t.literal('update');
export const RecommendationsFetch = t.literal('recommendationsFetch');
export const ServerLookup = t.literal('serverLookup');

export const GetDonationOptInNudgeStatus = t.literal(
  'GetDonationOptInNudgeStatus'
);
export const SetDonationOptInNudgeStatus = t.literal(
  'SetDonationOptInNudgeStatus'
);

export const MessageType = t.union(
  [
    APIRequest,
    ErrorOccurred,
    GetSettings,
    UpdateSettings,
    GetKeypair,
    GenerateKeypair,
    DeleteKeypair,
    ServerLookup,
    ReloadExtension,
    GetContentCreator,
    UpdateContentCreator,
    GetDonationOptInNudgeStatus,
    SetDonationOptInNudgeStatus,
  ],
  'MessageType'
);

export const Messages = MessagesAPI({
  // keypair
  [GenerateKeypair.value]: { payload: t.void, response: Keypair },
  [GetKeypair.value]: { payload: t.void, response: Keypair },
  [DeleteKeypair.value]: { payload: t.void, response: t.undefined },
  // settings
  [GetSettings.value]: {
    payload: t.void,
    response: t.union([Settings, t.null]),
  },
  [UpdateSettings.value]: {
    payload: t.union([Settings, t.null]),
    response: t.union([Settings, t.null]),
  },
  // content creator auth
  [GetAuth.value]: {
    payload: t.void,
    response: t.union([AuthResponse, t.null]),
  },
  [UpdateAuth.value]: {
    payload: t.union([AuthResponse, t.null]),
    response: t.union([AuthResponse, t.null]),
  },
  [GetContentCreator.value]: {
    payload: t.void,
    response: t.union([ContentCreator, t.null]),
  },
  [UpdateContentCreator.value]: {
    payload: t.union([ContentCreator, t.null]),
    response: t.union([ContentCreator, t.null]),
  },
  [RecommendationsFetch.value]: { payload: t.any, response: t.any },
  // API Request
  [APIRequest.value]: {
    payload: t.type({ staticPath: t.string, Input: t.any }),
    response: t.any,
  },
  [ReloadExtension.value]: { payload: t.any, response: t.undefined },
  [ServerLookup.value]: { payload: t.any, response: t.undefined },
  [ErrorOccurred.value]: { payload: t.any, response: t.any },
  [GetDonationOptInNudgeStatus.value]: {
    payload: t.void,
    response: OptInNudgeStatus,
  },
  [SetDonationOptInNudgeStatus.value]: {
    payload: OptInNudgeStatus,
    response: OptInNudgeStatus,
  },
});

export type Messages = typeof Messages;

export const browser = GetBrowserProvider(Messages);
