var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import registerAutomation from './commands/register-automation';
const menu = yargs(hideBin(process.argv))
    .scriptName('tktrex-automation')
    .command('register <file>', 'Register an automation file', (y) => y
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
}), (argv) => __awaiter(void 0, void 0, void 0, function* () { return registerAutomation(argv); }));
void menu.strictCommands().demandCommand(1, 'Please provide a command').parse();
