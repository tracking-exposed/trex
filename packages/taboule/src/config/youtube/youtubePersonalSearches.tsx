import { Box } from '@mui/material';
import { SearchMetadata } from '@yttrex/shared/models/metadata/Metadata';
import { SearchNatureType } from '@yttrex/shared/models/Nature';
import { queryStrict, refetch } from 'avenger';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/TaskEither';
import * as React from 'react';
import CSVDownloadButton from '../../components/buttons/CSVDownloadButton';
import ExpandView from '../../components/expand-view/ExpandView';
import { ListMetadataRequestInput } from '../../state/queries';
import { GetTabouleQueryConf } from '../config.type';
import {
  columnDefault,
  fieldsDefaultHead,
  fieldsDefaultTail,
} from '../defaults';
import { getApplyFilterFnIncluded } from '../filters';
import * as inputs from '../inputs';

/**
 * YouTube Personal Search taboule query configuration
 *
 * Columns:
 *  - id
 *  - query
 *  - results
 *  - savingTime
 *  - experimentId
 *  - researchTag
 * Expand:
 *  - selected
 * Actions:
 *  - download csv
 *
 * @param opts - Taboule query options {@link GetTabouleQueryConfOpts}
 * @returns taboule query configuration for youtube personal "home"
 */
export const youtubePersonalSearches: GetTabouleQueryConf<
  SearchMetadata,
  ListMetadataRequestInput
> = ({ clients, commands, params }) => ({
  filters: {
    nature: SearchNatureType.value,
  },
  inputs: (params, setParams) => (
    <div>
      {inputs.publicKeyInput(params, setParams)}
      {inputs.experimentIdInput(params, setParams)}
    </div>
  ),
  query: queryStrict(
    ({ Query: { filter, ...query } }) =>
      pipe(
        clients.YT.v2.Metadata.ListMetadata({
          Query: {
            ...query,
            format: 'json',
            filter: {
              query: undefined,
              ...filter,
              nature: 'search',
            },
          },
        }),
        TE.map((content) => ({
          total: content.totals.search,
          content: content.data as any[] as SearchMetadata[],
        }))
      ),
    refetch
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
                  nature: SearchNatureType.value,
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
