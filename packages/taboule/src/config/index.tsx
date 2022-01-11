import { Box, Typography } from '@material-ui/core';
import { DataGridProps, GridColTypeDef } from '@material-ui/data-grid';
import { ChannelRelated } from '@shared/models/ChannelRelated';
import {
  HomeMetadata,
  SearchMetadata,
  VideoMetadata,
} from '@shared/models/contributor/ContributorPersonalStats';
import {
  SummaryHTMLMetadata,
  SummaryMetadata,
} from '@shared/models/contributor/ContributorPersonalSummary';
import { TikTokSearchMetadata } from '@shared/models/http/tiktok/TikTokSearch';
import { GuardoniExperiment, Metadata } from '@shared/models/Metadata';
import * as React from 'react';
import CSVDownloadButton from '../components/buttons/CSVDownloadButton';
import DeleteButton from '../components/buttons/DeleteButton';
import * as cells from '../components/gridCells';
import { TabouleCommands } from '../state/commands';
import * as actions from './actions';
import * as inputs from './inputs';
import * as params from './params';

interface TabouleColumnProps<K> extends Omit<GridColTypeDef, 'field'> {
  field: K | 'actions';
}

interface TabouleQueryConfiguration<P extends Record<string, any>>
  extends Omit<DataGridProps, 'columns' | 'rows'> {
  columns: Array<TabouleColumnProps<keyof P>>;
  inputs?: (params: any, setParams: React.Dispatch<any>) => JSX.Element;
  actions?: () => JSX.Element;
}

interface TabouleConfiguration {
  ccRelatedUsers: TabouleQueryConfiguration<ChannelRelated>;
  getExperimentById: TabouleQueryConfiguration<Metadata>;
  getExperimentList: TabouleQueryConfiguration<GuardoniExperiment>;
  personalAds: TabouleQueryConfiguration<{}>;
  personalHomes: TabouleQueryConfiguration<HomeMetadata>;
  personalSearches: TabouleQueryConfiguration<SearchMetadata>;
  personalVideos: TabouleQueryConfiguration<VideoMetadata>;
  tikTokPersonalHTMLSummary: TabouleQueryConfiguration<SummaryHTMLMetadata>;
  tikTokPersonalMetadataSummary: TabouleQueryConfiguration<SummaryMetadata>;
  tikTokSearches: TabouleQueryConfiguration<TikTokSearchMetadata>;
}

export const defaultConfiguration = (
  commands: TabouleCommands,
  params: any
): TabouleConfiguration => {
  return {
    ccRelatedUsers: {
      inputs: inputs.channelIdInput,
      columns: [
        {
          field: 'recommendedSource',
          headerName: 'Recommended Source',
          minWidth: 160,
        },
        {
          field: 'percentage',
          minWidth: 160,
        },
        {
          field: 'recommendedChannelCount',
          minWidth: 160,
        },
      ],
    },
    getExperimentById: {
      inputs: inputs.experimentIdInput,
      columns: [
        {
          field: 'savingTime',
          headerName: 'savingTime',
          minWidth: 400,
          renderCell: cells.distanceFromNowCell,
        },
      ],
    },
    getExperimentList: {
      columns: [
        {
          field: 'experimentId',
          headerName: 'experimentId',
          minWidth: 400,
        },
        {
          field: 'when',
          headerName: 'Registered',
          minWidth: 200,
          renderCell: cells.distanceFromNowCell,
        },
        {
          field: 'links',
          minWidth: 350,
          renderCell: (params) => {
            return (
              <Box key={params.id}>
                {((params?.value as any[]) || []).map((linkinfo) => {
                  return <a href={linkinfo.url}>{linkinfo.urltag}</a>;
                })}
              </Box>
            );
          },
        },
      ],
    },
    personalSearches: {
      inputs: inputs.publicKeyInput,
      actions: () => {
        return (
          <Box textAlign={'right'}>
            <CSVDownloadButton
              onClick={() => {
                void commands.downloadAsCSV({
                  Params: {
                    publicKey: params.publicKey,
                    type: 'search',
                  },
                })();
              }}
            />
          </Box>
        );
      },
      columns: [
        {
          field: 'id',
          minWidth: 100,
        },
        {
          field: 'savingTime',
          minWidth: 200,
          renderCell: cells.distanceFromNowCell,
        },
        {
          field: 'query',
          minWidth: 350,
          renderCell: (params) => {
            return (
              <Typography variant="h6">{params.formattedValue}</Typography>
            );
          },
        },
        {
          field: 'results',
          minWidth: 150,
        },
        {
          field: 'actions',
          minWidth: 200,
          renderCell: (cellParams) => {
            return (
              <Box>
                <DeleteButton
                  id={cellParams.row.id}
                  onClick={(id) => {
                    void commands.deleteContribution(
                      {
                        Params: {
                          publicKey: params.publicKey,
                          selector: 'undefined',
                        },
                      },
                      {}
                    )();
                  }}
                />
                <CSVDownloadButton
                  onClick={() => {
                    void commands.downloadSearchesAsCSV({
                      Params: {
                        queryString: cellParams.getValue(
                          cellParams.row.id,
                          'query'
                        ) as string,
                      },
                    })();
                  }}
                />
              </Box>
            );
          },
        },
      ],
    },
    personalVideos: {
      inputs: inputs.publicKeyInput,
      actions: () => {
        return (
          <Box textAlign={'right'}>
            <CSVDownloadButton
              onClick={() => {
                void commands.downloadAsCSV({
                  Params: {
                    publicKey: params.publicKey,
                    type: 'video',
                  },
                })();
              }}
            />
          </Box>
        );
      },
      columns: [
        {
          field: 'relative',
          minWidth: 150,
        },
        {
          field: 'authorName',
          minWidth: 150,
        },
        {
          field: 'authorSource',
          minWidth: 150,
        },
        {
          field: 'actions',
          minWidth: 200,
          renderCell: actions.personalMetadataActions(commands, params),
        },
      ],
    },
    personalAds: {
      inputs: inputs.publicKeyInput,
      columns: [],
    },
    personalHomes: {
      inputs: inputs.publicKeyInput,
      columns: [
        {
          field: 'id',
          minWidth: 100,
        },
        {
          field: 'savingTime',
          minWidth: 150,
          renderCell: cells.distanceFromNowCell,
        },
        {
          field: 'selected',
          minWidth: 150,
          renderCell: (params) => {
            if (Array.isArray(params.value)) {
              return params.value.length;
            }
            return 0;
          },
        },
        {
          field: 'actions',
          minWidth: 200,
          renderCell: actions.personalMetadataActions(commands, params),
        },
      ],
    },
    tikTokPersonalHTMLSummary: {
      inputs: inputs.publicKeyInput,
      columns: [
        {
          field: 'id',
          minWidth: 200,
        },
        {
          field: 'timelineId',
          minWidth: 200,
        },
        {
          field: 'href',
          minWidth: 200,
        },
        {
          field: 'savingTime',
          minWidth: 200,
          renderCell: cells.distanceFromNowCell,
        },
      ],
    },
    tikTokPersonalMetadataSummary: {
      inputs: inputs.publicKeyInput,
      columns: [
        {
          field: 'id',
          minWidth: 200,
        },
        {
          field: 'timelineId',
          minWidth: 200,
        },
        {
          field: 'author',
          minWidth: 200,
          renderCell: (props) => {
            return <Typography>{(props.value as any)?.name ?? ''}</Typography>;
          },
        },
        {
          field: 'relative',
          minWidth: 200,
        },
      ],
    },
    tikTokSearches: {
      inputs: inputs.publicKeyInput,
      actions: () => {
        return (
          <Box textAlign={'right'}>
            <CSVDownloadButton
              onClick={() => {
                void commands.downloadAsCSV({
                  Params: {
                    publicKey: params.publicKey,
                    type: 'search',
                  },
                })();
              }}
            />
          </Box>
        );
      },
      columns: [
        {
          field: 'textdesc',
          minWidth: 200,
        },
        {
          field: 'query',
          minWidth: 200,
        },
        {
          field: 'thumbnail',
          renderCell: cells.avatarCell,
        },
        {
          field: 'video',
          renderCell: (params) => {
            const videoId = (params.value as any).videoId;
            return <Typography variant="subtitle1">{videoId}</Typography>;
          },
        },
        {
          field: 'savingTime',
          renderCell: cells.distanceFromNowCell,
        },
        {
          field: 'publishingDate',
          renderCell: cells.distanceFromNowCell,
        },
      ],
    },
  };
};

export { actions, inputs, params };
