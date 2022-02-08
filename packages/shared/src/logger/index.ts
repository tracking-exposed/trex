import D from 'debug';

type DebugFn = (s: string, ...args: any[]) => void;

export interface Logger {
  info: DebugFn;
  error: DebugFn;
  debug: DebugFn;
  extend: (namespace: string) => Logger;
}

export const GetLogger = (name: string | D.Debugger): Logger => {
  const l = typeof name === 'string' ? D(name) : name;

  const info = l.extend('info');
  const error = l.extend('error');
  const debug = l.extend('debug');

  return {
    info,
    error,
    debug,
    extend: (extName) => GetLogger(l.extend(extName)),
  };
};

export const trexLogger = GetLogger(D('@trex'));
