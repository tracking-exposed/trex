import * as t from 'io-ts';

const PICK_CSV_FILE_EVENT = t.literal('pickCSVFile');
const GET_GUARDONI_CONFIG_EVENT = t.literal('getGuardoniConfig');
const SET_GUARDONI_CONFIG_EVENT = t.literal('setGuardoniConfig');
const GET_GUARDONI_ENV_EVENT = t.literal('getGuardoniEnvEvent');
const OPEN_GUARDONI_DIR = t.literal('openGuardoniDir');
const CREATE_EXPERIMENT_EVENT = t.literal('createExperimentEvent');
const GET_PUBLIC_DIRECTIVES = t.literal('getPublicDirectives');
const RUN_GUARDONI_EVENT = t.literal('runGuardoni');
const RUN_AUTO_GUARDONI_EVENT = t.literal('runAutoGuardoni');
const GUARDONI_ERROR_EVENT = t.literal('guardoniError');
const GUARDONI_OUTPUT_EVENT = t.literal('guardoniOutput');
const GLOBAL_ERROR_EVENT = t.literal('globalError');
const CHANGE_PLATFORM_EVENT = t.literal('changePlatform');

export const EVENTS = {
  PICK_CSV_FILE_EVENT,
  GET_GUARDONI_CONFIG_EVENT,
  SET_GUARDONI_CONFIG_EVENT,
  GET_GUARDONI_ENV_EVENT,
  OPEN_GUARDONI_DIR,
  CREATE_EXPERIMENT_EVENT,
  GET_PUBLIC_DIRECTIVES,
  RUN_GUARDONI_EVENT,
  RUN_AUTO_GUARDONI_EVENT,
  GUARDONI_ERROR_EVENT,
  GUARDONI_OUTPUT_EVENT,
  GLOBAL_ERROR_EVENT,
  CHANGE_PLATFORM_EVENT,
};

export const EVENT = t.union(
  [
    PICK_CSV_FILE_EVENT,
    GET_GUARDONI_CONFIG_EVENT,
    SET_GUARDONI_CONFIG_EVENT,
    OPEN_GUARDONI_DIR,
    CREATE_EXPERIMENT_EVENT,
    GET_PUBLIC_DIRECTIVES,
    RUN_GUARDONI_EVENT,
    RUN_AUTO_GUARDONI_EVENT,
    GUARDONI_ERROR_EVENT,
    GUARDONI_OUTPUT_EVENT,
    GLOBAL_ERROR_EVENT,
    CHANGE_PLATFORM_EVENT,
  ],
  'EVENTS'
);

export type EVENT = t.TypeOf<typeof EVENT>;
