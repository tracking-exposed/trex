import * as t from 'io-ts';

export const PICK_CSV_FILE_EVENT = t.literal('pickCSVFile');
export const GET_GUARDONI_CONFIG_EVENT = t.literal('getGuardoniConfig');
export const OPEN_GUARDONI_DIR = t.literal('openGuardoniDir');
export const CREATE_EXPERIMENT_EVENT = t.literal('createExperimentEvent');
export const GET_PUBLIC_DIRECTIVES = t.literal('getPublicDirectives');
export const RUN_GUARDONI_EVENT = t.literal('runGuardoni');
export const RUN_AUTO_GUARDONI_EVENT = t.literal('runAutoGuardoni');
export const GUARDONI_ERROR_EVENT = t.literal('guardoniError');
export const GUARDONI_OUTPUT_EVENT = t.literal('guardoniOutput');
export const GLOBAL_ERROR_EVENT = t.literal('globalError');

export const EVENTS = t.union(
  [
    PICK_CSV_FILE_EVENT,
    GET_GUARDONI_CONFIG_EVENT,
    OPEN_GUARDONI_DIR,
    CREATE_EXPERIMENT_EVENT,
    RUN_GUARDONI_EVENT,
    RUN_AUTO_GUARDONI_EVENT,
    GUARDONI_ERROR_EVENT,
    GUARDONI_OUTPUT_EVENT,
    GLOBAL_ERROR_EVENT,
  ],
  'EVENTS'
);

export type EVENTS = t.TypeOf<typeof EVENTS>;
