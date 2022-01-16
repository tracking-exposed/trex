import { pipe } from 'fp-ts/lib/function';
import { map, mapLeft } from 'fp-ts/lib/Either';
import { failure } from 'io-ts/lib/PathReporter';

// this needs to go before the import of
// GetLogger to set the DEBUG environment variable
import rawConfig from './loadEnv';
import Config from './models/Config';

import {
  GetLogger,
} from '@shared/logger';

import main from './main';

const log = GetLogger('tt-automation');

log.debug(
  'loaded config\n%O',
  rawConfig,
);

pipe(
  rawConfig,
  Config.decode,
  mapLeft((errors) => {
    log.error(
      'configuration errors\n%O',
      failure(errors),
    );
  }),
  map(main),
);
