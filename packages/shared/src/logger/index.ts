import D from 'debug';

type DebugFn = (s: string, ...args: any[]) => void;

export interface Logger {
  info: DebugFn;
  warn: DebugFn;
  error: DebugFn;
  debug: DebugFn;
  extend: (namespace: string) => Logger;
}

export const GetLogger = (name: string | D.Debugger): Logger => {
  const l = typeof name === 'string' ? D(name) : name;

  const info = l.extend('info');
  const warn = l.extend('warn');
  const error = l.extend('error');
  const debug = l.extend('debug');

  return {
    info,
    warn,
    error,
    debug,
    extend: (extName) => GetLogger(l.extend(extName)),
  };
};

export const trexLogger = GetLogger(D('@trex'));
