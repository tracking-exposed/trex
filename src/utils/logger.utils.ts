import debug from 'debug';
import { config } from '../config';

export const logger = debug('@ycai');

type DebugFn = (s: string, ...args: any[]) => void;

interface Logger {
  info: DebugFn;
  error: DebugFn;
  debug: DebugFn;
  extend: (namespace: string) => Logger;
}

export const GetLogger = (name: string, d?: debug.Debugger): Logger => {
  const l = (d ?? logger).extend(name);

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

export const apiLogger = GetLogger('API');

debug.enable(config.REACT_APP_LOGGER);
