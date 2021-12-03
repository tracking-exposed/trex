import debug from 'debug';

export const logger = debug('@yttrex');

type DebugFn = (s: string, ...args: any[]) => void;

interface Logger {
  info: DebugFn;
  error: DebugFn;
  debug: DebugFn;
  extend: (namespace: string) => Logger;
}

export const GetLogger = (name: string, d?: debug.Debugger): Logger => {
  const baseLogger = d ?? logger;
  const l = baseLogger.extend(name);

  const info = l.extend('info');
  const error = l.extend('error');
  const debug = l.extend('debug');

  return {
    info,
    error,
    debug,
    extend: (ns) => GetLogger(ns, l),
  };
};
