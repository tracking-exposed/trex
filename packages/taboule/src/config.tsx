import {
  Box,
  FormControlLabel,
  IconButton,
  Input,
  Tooltip,
  Typography,
} from '@material-ui/core';
import {
  DataGridProps,
  GridCellParams,
  GridColTypeDef,
} from '@material-ui/data-grid';
import CompareIcon from '@material-ui/icons/CompareOutlined';
import RelatedIcon from '@material-ui/icons/Replay30Outlined';
import { ChannelRelated } from '@shared/models/ChannelRelated';
import {
  HomeMetadata,
  SearchMetadata,
  VideoMetadata,
} from '@shared/models/contributor/ContributorPersonalStats';
import { Metadata } from '@shared/models/Metadata';
import DeleteButton from 'components/buttons/DeleteButton';
import { formatDistanceToNow } from 'date-fns';
import * as React from 'react';
import CSVDownloadButton from './components/buttons/CSVDownloadButton';
import { TabouleCommands } from './state/commands';

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
  compareExperiment: TabouleQueryConfiguration<Metadata>;
  personalAds: TabouleQueryConfiguration<{}>;
  personalHomes: TabouleQueryConfiguration<HomeMetadata>;
  personalSearches: TabouleQueryConfiguration<SearchMetadata>;
  personalVideos: TabouleQueryConfiguration<VideoMetadata>;
}

const defaultChannelId = 'c14bb994-d13d-4a5e-bdee-a62976facca9';
const defaultPublicKey = '39kM5AyUrGXZaJPseoyKuNT2968Ee5SY6fbWxWcG1ivC';
export const defaultParams = {
  ccRelatedUsers: {
    channelId: defaultChannelId,
  },
  compareExperiment: {},
  personalHomes: {
    publicKey: defaultPublicKey,
  },
  personalSearches: {
    publicKey: defaultPublicKey,
  },
  personalVideos: {
    publicKey: defaultPublicKey,
  },
  personalAds: {
    publicKey: defaultPublicKey,
  },
};

const channelIdInput = (
  params: any,
  setParams: React.Dispatch<any>
): JSX.Element => {
  return (
    <Box margin={2}>
      <FormControlLabel
        style={{
          alignItems: 'flex-start',
        }}
        labelPlacement="top"
        label="Channel ID"
        inputMode="text"
        control={
          <Input
            name="channelId"
            value={params.channelId ?? defaultChannelId}
            onChange={(e) =>
              setParams({ ...params, publicKey: e.target.value })
            }
          />
        }
      />
    </Box>
  );
};

const publicKeyInput = (
  params: any,
  setParams: React.Dispatch<any>
): JSX.Element => {
  return (
    <Box margin={2}>
      <FormControlLabel
        style={{
          alignItems: 'flex-start',
        }}
        labelPlacement="top"
        label="Public Key"
        inputMode="text"
        control={
          <Input
            name="publicKey"
            value={params.publicKey ?? defaultPublicKey}
            onChange={(e) =>
              setParams({ ...params, publicKey: e.target.value })
            }
          />
        }
      />
    </Box>
  );
};

const personalMetadataActions =
  (commands: TabouleCommands, params: any) =>
  // eslint-disable-next-line react/display-name
  (cellParams: GridCellParams): JSX.Element => {
    return (
      <Box position={'relative'}>
        <DeleteButton
          id={cellParams.row.id}
          onClick={() => {
            void commands.deleteContribution(
              {
                Params: {
                  publicKey: params.publicKey,
                  selector: 'undefined',
                },
              },
              {
                personalSearches: {
                  Params: params,
                },
              }
            )();
          }}
        />
        <Tooltip title="Compare" placement="top">
          <IconButton size="small">
            <CompareIcon color="error" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Related" placement="top">
          <IconButton size="small">
            <RelatedIcon color="error" />
          </IconButton>
        </Tooltip>
        <CSVDownloadButton
          onClick={() => {
            void commands.downloadSearchesAsCSV(
              {
                Params: {
                  queryString: cellParams.getValue(
                    cellParams.row.id,
                    'query'
                  ) as any,
                },
              },
              {
                personalSearch: {
                  Params: params,
                },
              }
            )();
          }}
        />
      </Box>
    );
  };

export const defaultConfiguration = (
  commands: TabouleCommands,
  params: any
): TabouleConfiguration => {
  return {
    ccRelatedUsers: {
      inputs: channelIdInput,
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
    compareExperiment: {
      columns: [
        {
          field: 'savingTime',
          headerName: 'savingTime',
          minWidth: 400,
        },
      ],
    },
    personalSearches: {
      inputs: publicKeyInput,
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
          renderCell: (params) => {
            return formatDistanceToNow(new Date(params.formattedValue as any));
          },
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
      inputs: publicKeyInput,
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
          renderCell: personalMetadataActions(commands, params),
        },
      ],
    },
    personalAds: {
      inputs: publicKeyInput,
      columns: [],
    },
    personalHomes: {
      inputs: publicKeyInput,
      columns: [
        {
          field: 'id',
          minWidth: 100,
        },
        {
          field: 'savingTime',
          minWidth: 150,
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
          renderCell: personalMetadataActions(commands, params),
        },
      ],
    },
  };
};
