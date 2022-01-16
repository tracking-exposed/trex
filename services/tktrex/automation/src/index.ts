import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import registerAutomation from './commands/register-automation';

const menu = yargs(hideBin(process.argv))
  .scriptName('tktrex-automation')
  .command(
    'register <file>',
    'Register an automation file',
    (y) =>
      y
        .positional('file', {
          demandOption: true,
          desc: 'File containing one automation step per line',
          type: 'string',
        })
        .option('description', {
          alias: 'd',
          desc: 'Save a comment together with this automation',
          type: 'string',
        })
        .option('label', {
          alias: 'l',
          desc: 'Save a label together with this automation',
          type: 'string',
        })
        .option('type', {
          alias: 't',
          desc: 'Automation type',
          type: 'string',
          demandOption: true,
          choices: ['tiktok-fr-elections'],
        }),
    async(argv) => registerAutomation(argv),
  );

void menu.strictCommands().demandCommand(1, 'Please provide a command').parse();
