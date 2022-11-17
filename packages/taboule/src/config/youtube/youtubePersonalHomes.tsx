import { HomeMetadata } from '@yttrex/shared/models/metadata/HomeMetadata';
import { HomeNatureType } from '@yttrex/shared/models/Nature';
import * as React from 'react';
import { TabouleCommands } from 'state/commands';
import { TabouleQueryConfiguration } from '../config.type';
import {
  columnDefault,
  fieldsDefaultHead,
  fieldsDefaultTail,
} from '../defaults';
import * as inputs from '../inputs';

export const youtubePersonalHomes = (
  commmands: TabouleCommands,
  params: any
): TabouleQueryConfiguration<HomeMetadata> => ({
  inputs: (params, setParams) => (
    <div>
      {inputs.publicKeyInput(params, setParams)}
      {inputs.experimentIdInput(params, setParams)}
    </div>
  ),
  filters: {
    nature: HomeNatureType.value,
  },
  columns: [
    ...fieldsDefaultHead,
    {
      ...columnDefault,
      filterable: true,
      field: 'login',
      minWidth: 100,
      type: 'boolean',
    },
    {
      ...columnDefault,
      field: 'selected',
      renderCell: (params) => {
        if (Array.isArray(params.value)) {
          return params.value.length;
        }
        return 0;
      },
    },
    {
      ...columnDefault,
      field: 'sections',
      renderCell: (params) => {
        if (Array.isArray(params.value)) {
          return params.value.length;
        }
        return 0;
      },
    },

    ...fieldsDefaultTail,
  ],
});
