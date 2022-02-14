import { trexLogger } from '@shared/logger';
import D from 'debug';

const log = trexLogger.extend('tk-ext');

D.enable(process.env.DEBUG ?? '');

export default log;
