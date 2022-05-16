import HubEvent, { HubEventBase } from '@shared/extension/models/HubEvent';

export interface NewVideoEvent extends HubEventBase {
  type: 'NewVideo';
  payload: {
    feedCounter: number;
    feedId: string;
    href: string;
    html: string;
    rect: DOMRect;
    videoCounter: number;
  };
}

export interface SearchEvent extends HubEventBase {
  type: 'Search';
  payload: {
    html: string;
    href: string;
  };
}

export interface SuggestedEvent extends HubEventBase {
  type: 'Suggested';
  payload: {
    html: string;
    href: string;
  };
}

export type TKHubEvent =
  | HubEvent
  | NewVideoEvent
  | SearchEvent
  | SuggestedEvent;
