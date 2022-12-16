import { Box } from '@mui/material';
import { SearchMetadata } from '@tktrex/shared/models/metadata';
import { SearchType } from '@tktrex/shared/models/Nature';
import { SearchNatureType } from '@yttrex/shared/models/Nature';
import { available, queryStrict } from 'avenger';
import ExpandView from '../../components/expand-view/ExpandView';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/TaskEither';
import * as React from 'react';
import CSVDownloadButton from '../../components/buttons/CSVDownloadButton';
import { ListMetadataRequestInput } from '../../state/queries';
import { GetTabouleQueryConf } from '../config.type';
import {
  columnDefault,
  fieldsDefaultHead,
  fieldsDefaultTail,
} from '../defaults';
import * as inputs from '../inputs';

/**
 * TikTok Personal Search taboule query configuration
 *
 * Columns:
 *  - id
 *  - query
 *  - results
 *  - savingTime
 *  - experimentId
 *  - researchTag
 * Expand:
 *  - results
 * Actions:
 *  - download csv
 *
 * @param opts - Taboule query options {@link GetTabouleQueryConfOpts}
 * @returns taboule query configuration for tiktok personal "search"
 */
export const tikTokPersonalSearch: GetTabouleQueryConf<
  SearchMetadata,
  ListMetadataRequestInput
> = ({ clients, commands, params }) => ({
  filters: {
    nature: SearchType.value,
  },
  inputs: inputs.publicKeyInput,
  query: queryStrict(
    ({ Query: { amount, skip, filter, ...query } }) =>
      pipe(
        clients.TK.v2.Metadata.ListMetadata({
          ValidateOutput: false,
          Query: {
            ...query,
            amount,
            skip,
            filter: {
              ...filter,
            },
          },
        } as any),
        TE.map((content) => ({
          total: content.totals.search,
          content: content.data as any[] as SearchMetadata[],
        }))
      ),
    available
  ),
  actions: (filter) => {
    return (
      <Box textAlign={'right'}>
        <CSVDownloadButton
          onClick={() => {
            void commands.tkDownloadAsCSV({
              Query: {
                ...params,
                filter: {
                  ...filter,
                  type: SearchNatureType.value,
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
            <li key={r.textdesc}>{r.textdesc}</li>
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
      renderCell: (params) => {
        return (
          <a href={`/search/#${encodeURI(params.formattedValue as string)}`}>
            {params.formattedValue}
          </a>
        );
      },
    },
    {
      ...columnDefault,
      field: 'results',
      renderCell: (params) => {
        return <span>{(params.row.results ?? []).length}</span>;
      },
      width: 40,
    },
    ...fieldsDefaultTail,
  ],
});
