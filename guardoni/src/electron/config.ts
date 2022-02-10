import os from 'os';
import * as path from 'path';

export const DEFAULT_BASE_PATH = path.resolve(
  os.homedir(),
  '.guardoni/electron'
);
export const DEFAULT_SERVER = 'https://youtube.tracking.exposed/api';
export const DEFAULT_EXTENSION_DIR = path.resolve(
  DEFAULT_BASE_PATH,
  'extension'
);

export const DEFAULT_LOAD_FOR = 3000;
