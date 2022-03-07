import { trexLogger } from '../logger';
import D from 'debug';

const log = trexLogger.extend('ext');

D.enable(process.env.DEBUG ?? '');

export default log;
