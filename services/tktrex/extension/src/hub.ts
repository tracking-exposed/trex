export type Handler = (type: HandlerType, payload: unknown) => void;
export type HandlerType =
  'windowUnload' | 'newVideo' | 'suggested' | '*';
export type HandlerMap = Partial<Record<HandlerType, Handler[]>>;

class Hub {
  handlers: HandlerMap;

  constructor () {
    this.handlers = {};
  }

  register(type: HandlerType, handler: Handler): void {
    if (!this.handlers[type]) {
      this.handlers[type] = [];
    }

    (this.handlers[type] as Handler[]).push(handler);
  }

  event(type: HandlerType, payload: unknown): void {
    const funcs = this.handlers[type];
    const funcsStar = this.handlers['*'];
    if (funcs) {
      funcs.forEach((func) => func(type, payload));
    }

    if (funcsStar) {
      funcsStar.forEach((func) => func(type, payload));
    }
  }
}

const HUB = new Hub();

export default HUB;
