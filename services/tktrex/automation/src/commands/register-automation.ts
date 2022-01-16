import { Command, CommandConfig } from '../models/Command';

export const registerAutomation =
  (config: CommandConfig) =>
    async({
      type,
      file,
      description,
      label,
    }: {
      type: string;
      file: string;
      description?: string;
      label?: string;
    }): Promise<void> => {
      config.log.info('Registering automation for "%s"...', type);
    };

export const registerAutomationCommand: Command = {
  add: (config) => (yargs) =>
    yargs.command(
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
      async(argv) => registerAutomation(config)(argv),
    ),
};

export default registerAutomationCommand;
