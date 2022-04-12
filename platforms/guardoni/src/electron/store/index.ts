import Store from 'electron-store';
import { Platform } from '../app/Header';

interface Conf {
  platform: Platform;
}

const store = new Store<Conf>();

export default store;
