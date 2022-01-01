import HubEvent from './models/HubEvent';

export type Handler = (event: HubEvent) => void;

type HandlerType = HubEvent['type'];
type HandlerMap = { [key in HandlerType]?: Handler[] };

export class Hub {
  private readonly specificHandlers: HandlerMap;
  private readonly genericHandlers: Handler[];

  constructor () {
    this.specificHandlers = {};
    this.genericHandlers = [];
  }

  on<ET extends HubEvent['type']>(
    type: ET,
    handler: (event: HubEvent & { type: ET }) => void,
  ): Hub {
    if (!this.specificHandlers[type]) {
      this.specificHandlers[type] = [];
    }

    (this.specificHandlers[type] as Handler[]).push(
      handler as Handler,
    );

    return this;
  }

  onAnyEvent(handler: Handler): Hub {
    this.genericHandlers.push(handler);
    return this;
  }

  dispatch(e: HubEvent): Hub {
    const specificHandlers = this.specificHandlers[e.type];

    if (specificHandlers) {
      specificHandlers.forEach(func => func(e));
    }

    this.genericHandlers.forEach(func => func(e));

    return this;
  }
}

export default new Hub();
