import { HubEventBase } from './models/HubEvent';

export type HubHandler = <E extends HubEventBase>(event: E) => void;

// type HandlerType = HubEvent['type'];
type HandlerMap<K extends string> = { [key in K]?: HubHandler[] };

export class Hub<HE extends HubEventBase> {
  private readonly specificHandlers: HandlerMap<HE['type']>;
  private readonly genericHandlers: HubHandler[];

  constructor() {
    this.specificHandlers = {};
    this.genericHandlers = [];
  }

  on<E extends HE>(type: E['type'], handler: (event: E) => void): Hub<HE> {
    if (!this.specificHandlers[type]) {
      this.specificHandlers[type] = [];
    }

    (this.specificHandlers[type] as HubHandler[]).push(handler as HubHandler);

    return this as any;
  }

  onAnyEvent(handler: HubHandler): Hub<HE> {
    this.genericHandlers.push(handler);
    return this;
  }

  dispatch(e: HE): Hub<HE> {
    const specificHandlers: HubHandler[] = (this.specificHandlers as any)[
      e.type
    ];

    if (specificHandlers) {
      specificHandlers.forEach((func) => func(e));
    }

    this.genericHandlers.forEach((func) => func(e));

    return this;
  }
}

// export default new Hub<HubEvent>();
