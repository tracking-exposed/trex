import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import registerAutomationCommand from './commands/register-automation';
import { CommandConfig } from './models/Command';

const menu = yargs(hideBin(process.argv)).scriptName('tktrex-automation');

export const main = async(config: CommandConfig): Promise<unknown> => {
  registerAutomationCommand.add(config)(menu);

  const res = menu
    .strictCommands()
    .demandCommand(1, 'Please provide a command')
    .parse();

  // res is not always a Promise,
  // convert it to one if it isn't
  return Promise.resolve(res);
};

export default main;
