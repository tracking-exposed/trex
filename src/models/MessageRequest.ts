import * as t from 'io-ts';


export const LocalLookup = t.literal('localLookup');
export const ServerLookup = t.literal('serverLookup');
export const ConfigUpdate = t.literal('configUpdate');
export const RecommendationsFetch = t.literal('recommendationsFetch')
export const ReloadExtension = t.literal('ReloadExtension');
export const Sync = t.literal('Sync');

export const MessageType = t.union([
    LocalLookup,
    ServerLookup,
    ConfigUpdate,
    RecommendationsFetch,
    ReloadExtension,
    Sync
], 'MessageType')

export type MessageType = t.TypeOf<typeof MessageType>


export const SyncRequest = t.strict({ type: Sync, payload: t.any, userId: t.string }, 'SyncRequest')
export type SyncRequest = t.TypeOf<typeof SyncRequest>

export const MessageRequest = t.union([
    t.strict({ type: LocalLookup, payload: t.any }),
    t.strict({ type: ServerLookup }),
    t.strict({ type: ConfigUpdate, payload: t.any }),
    t.strict({ type: RecommendationsFetch, payload: t.any }),
    t.strict({ type: ReloadExtension }),
    SyncRequest
], 'MessageRequest')
export type MessageRequest = t.TypeOf<typeof MessageRequest>