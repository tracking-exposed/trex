import HubEvent, { HubEventBase } from '@shared/extension/models/HubEvent';

/* TODO 
   TODO 
   TODO 

 * when something like this is implemented, should be commented 
 * where are the other part of the code than call these interfaces and where 
 * you should extend. I just added one of this and I'm struggling to understand 
 * where I should also update the code 
 * 
 * app/app.ts + this + src/handlers.ts (registerTKHandlers) + ??
 * */

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

export interface NativeVideoEvent extends HubEventBase {
  type: 'NativeVideo';
  payload: {
    feedCounter: number;
    feedId: string;
    href: string;
    html: string;
    videoCounter: number;
  };
}

export interface ProfileEvent extends HubEventBase {
  type: 'Profile';
  payload: {
    feedCounter: number;
    feedId: string;
    html: string;
    href: string;
    videoCounter: number;
  };
}

export interface SearchEvent extends HubEventBase {
  type: 'Search';
  payload: {
    html: string;
    href: string;
    feedId: string;
  };
}

export interface SuggestedEvent extends HubEventBase {
  type: 'Suggested';
  payload: {
    html: string;
    href: string;
    feedId: string;
  };
}

export interface SigiStateEvent extends HubEventBase {
  type: 'SigiState';
  payload: {
    state: any;
    href: string;
    feedId: string;
    feedCounter: number;
  };
}

export interface APIRequestEvent extends HubEventBase {
  type: 'APIRequestEvent';
  payload: {
    payload: string;
    href: string;
    feedId: string;
    feedCounter: number;
  };
}

export type TKHubEvent =
  | HubEvent
  | NewVideoEvent
  | NativeVideoEvent
  | SearchEvent
  | ProfileEvent
  | SuggestedEvent
  | SigiStateEvent
  | APIRequestEvent;
