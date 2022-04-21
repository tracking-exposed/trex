import * as path from 'path';
import * as os from 'os';

export const DEFAULT_BASE_PATH = path.resolve(os.homedir(), '.guardoni/config');
export const DEFAULT_EXTENSION_DIR = path.resolve(
  os.homedir(),
  '.guardoni/extension'
);

// yt defaults
export const DEFAULT_YT_BACKEND =
  process.env.YT_BACKEND ?? 'https://youtube.tracking.exposed/api';
export const DEFAULT_YT_EXTENSION_DIR = path.resolve(
  DEFAULT_EXTENSION_DIR,
  'yt'
);

// tk defaults
export const DEFAULT_TK_BACKEND =
  process.env.TK_BACKEND ?? 'https://youtube.tracking.exposed/api';
export const DEFAULT_TK_EXTENSION_DIR = path.resolve(
  DEFAULT_EXTENSION_DIR,
  'tk'
);

export const DEFAULT_LOAD_FOR = 3000;
