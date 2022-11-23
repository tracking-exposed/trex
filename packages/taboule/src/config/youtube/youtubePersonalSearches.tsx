import { Box } from '@mui/material';
import { SearchMetadata } from '@yttrex/shared/models/metadata/Metadata';
import { SearchNatureType } from '@yttrex/shared/models/Nature';
import ExpandView from '../../components/expand-view/ExpandView';
import * as React from 'react';
import CSVDownloadButton from '../../components/buttons/CSVDownloadButton';
import { GetTabouleQueryConf } from '../config.type';
import {
  columnDefault,
  fieldsDefaultHead,
  fieldsDefaultTail,
} from '../defaults';
import { getApplyFilterFnIncluded } from '../filters';
import * as inputs from '../inputs';

export const youtubePersonalSearches: GetTabouleQueryConf<SearchMetadata> = (
  commands,
  params
) => ({
  filters: {
    nature: SearchNatureType.value,
  },
  inputs: (params, setParams) => (
    <div>
      {inputs.publicKeyInput(params, setParams)}
      {inputs.experimentIdInput(params, setParams)}
    </div>
  ),
  actions: (filter) => {
    return (
      <Box textAlign={'right'}>
        <CSVDownloadButton
          onClick={() => {
            void commands.ytDownloadAsCSV({
              Query: {
                publicKey: params.publicKey,
                experimentId: params.experimentId,
                filter: {
                  ...filter,
                  nature: 'search',
                },
              },
            })();
          }}
        />
      </Box>
    );
  },
  expanded: ({ row, ...props }) => {
    return (
      <ExpandView {...props}>
        <ul>
          {row.results.map((r) => (
            <li key={r.title}>{r.title}</li>
          ))}
        </ul>
      </ExpandView>
    );
  },
  columns: [
    ...fieldsDefaultHead,
    {
      ...columnDefault,
      field: 'query',
      filterable: true,
      type: 'string',
      getApplyQuickFilterFn: getApplyFilterFnIncluded,
    },
    {
      ...columnDefault,
      field: 'results',
      renderCell: (params) => {
        if (Array.isArray(params.value)) {
          return params.value.length;
        }
        return 0;
      },
    },
    ...fieldsDefaultTail,
    // {
    //   ...columnDefault,
    //   field: 'actions',
    //   renderCell: (cellParams) => {
    //     return (
    //       <Box>
    //         <DeleteButton
    //           id={cellParams.row.id}
    //           onClick={(id) => {
    //             void commands.deleteContribution(
    //               {
    //                 Params: {
    //                   publicKey: params.publicKey,
    //                   selector: 'undefined',
    //                 },
    //               },
    //               {}
    //             )();
    //           }}
    //         />
    //         <CSVDownloadButton
    //           onClick={() => {
    //             void commands.downloadSearchesAsCSV({
    //               Params: {
    //                 queryString: cellParams.row.query,
    //               },
    //             })();
    //           }}
    //         />
    //       </Box>
    //     );
    //   },
    // },
  ],
});
