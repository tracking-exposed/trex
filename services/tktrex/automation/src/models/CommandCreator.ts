import yargs from 'yargs';

import Config from './Config';
import { Logger } from '@shared/logger';

export interface CommandConfig extends Config {
  log: Logger;
}

export interface CommandCreator {
  add: (config: CommandConfig) => (y: yargs.Argv) => yargs.Argv;
}

export default CommandCreator;
