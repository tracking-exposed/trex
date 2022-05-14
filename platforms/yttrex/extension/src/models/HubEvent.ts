import { HubEvent, HubEventBase } from '@shared/extension/models/HubEvent';

export interface NewVideoEvent extends HubEventBase {
  type: 'NewVideo';
  payload: {
    type: number | undefined;
    element: string;
    size: number;
    href: string;
    randomUUID: string;
  };
}

export interface NewLeafEvent extends HubEventBase {
  type: 'leaf';
  payload: {};
}

export type YTHubEvent = HubEvent | NewVideoEvent | NewLeafEvent;
