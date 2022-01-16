var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import dotenv from 'dotenv';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { GetLogger, } from '@shared/logger';
import registerAutomation from './commands/register-automation';
process.env.DEBUG = '*';
const log = GetLogger('tt-automation');
const mode = process.env.NODE_ENV === 'production'
    ? 'production' : 'development';
const dotEnvPath = mode === 'production'
    ? '.env' : '.env.development';
const { parsed: rawConfig } = dotenv.config({
    path: dotEnvPath,
});
log.error('lala');
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
void menu
    .strictCommands()
    .demandCommand(1, 'Please provide a command')
    .parse();
