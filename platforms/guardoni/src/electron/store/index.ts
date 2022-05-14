import Store from 'electron-store';
import { Platform } from '../../guardoni/types';

interface Conf {
  platform: Platform;
  basePath: string;
}

const store = new Store<Conf>();

export default store;
