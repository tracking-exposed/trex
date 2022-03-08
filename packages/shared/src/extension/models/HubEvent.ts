export interface HubEventBase {
  type: string;
  payload?: unknown;
}

export interface APIEvent extends HubEventBase {
  type: 'APIEvent';
  payload: {
    headers: any;
    data: any;
    url: any;
    response: any;
  };
}

export interface FullSaveEvent<N> extends HubEventBase {
  type: 'FullSave';
  payload: {
    type: N;
    element: string;
    feedId: string;
    href: string;
    reason: string;
    size: number;
  };
}

export interface SyncResponseEvent extends HubEventBase {
  type: 'SyncResponse';
  payload:
    | {
        type: 'Success';
        response: unknown;
      }
    | {
        type: 'Error';
        error: unknown;
      };
}

export interface APISyncResponseEvent extends HubEventBase {
  type: 'APISyncResponse';
  payload:
    | {
        type: 'Success';
        response: unknown;
      }
    | {
        type: 'Error';
        error: unknown;
      };
}

export interface WindowUnloadEvent extends HubEventBase {
  type: 'WindowUnload';
}

export type HubEvent =
  | WindowUnloadEvent
  | FullSaveEvent<any>
  | SyncResponseEvent
  | APISyncResponseEvent
  | APIEvent;

export default HubEvent;
