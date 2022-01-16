import yargs from 'yargs';

import Config from './Config';
import { Logger } from '@shared/logger';

export interface CommandConfig extends Config {
  log: Logger;
}

export interface Command {
  add: (config: CommandConfig) => (y: yargs.Argv) => yargs.Argv;
}

export default Command;
