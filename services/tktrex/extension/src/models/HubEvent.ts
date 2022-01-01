import Nature from './Nature';

export interface HubEventBase {
  type: HubEvent['type'];
  payload?: unknown;
}

export interface NewVideoEvent extends HubEventBase {
  type: 'NewVideo';
  payload: {
    feedCounter: number;
    feedId: string;
    href: string;
    html: string;
    rect: DOMRect;
    videoCounter: number;
  }
}

export interface FullSaveEvent extends HubEventBase {
  type: 'FullSave';
  payload: {
    type: Nature | null;
    element: string;
    feedId: string;
    href: string;
    reason: string;
    size: number;
  }
}

export interface SuggestedEvent extends HubEventBase {
  type: 'Suggested';
  payload: {
    html: string;
    href: string;
  }
}

export interface SyncResponseEvent extends HubEventBase {
  type: 'SyncResponse';
  payload: {
    type: 'Success';
    response: unknown;
  } | {
    type: 'Error';
    error: unknown;
  };
}

export interface WindowUnloadEvent extends HubEventBase {
  type: 'WindowUnload';
}

export type HubEvent =
  NewVideoEvent | WindowUnloadEvent |
  SuggestedEvent | FullSaveEvent |
  SyncResponseEvent;

export default HubEvent;
