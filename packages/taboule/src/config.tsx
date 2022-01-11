import {
  Box,
  FormControlLabel,
  IconButton,
  Input,
  Tooltip,
  Typography
} from '@material-ui/core';
import {
  DataGridProps,
  GridCellParams,
  GridColTypeDef
} from '@material-ui/data-grid';
import CompareIcon from '@material-ui/icons/CompareOutlined';
import RelatedIcon from '@material-ui/icons/Replay30Outlined';
import { ChannelRelated } from '@shared/models/ChannelRelated';
import {
  HomeMetadata,
  SearchMetadata,
  VideoMetadata
} from '@shared/models/contributor/ContributorPersonalStats';
import {
  SummaryHTMLMetadata,
  SummaryMetadata
} from '@shared/models/contributor/ContributorPersonalSummary';
import { TikTokSearchMetadata } from '@shared/models/http/tiktok/TikTokSearch';
import { GuardoniExperiment, Metadata } from '@shared/models/Metadata';
import * as React from 'react';
import CSVDownloadButton from './components/buttons/CSVDownloadButton';
import DeleteButton from './components/buttons/DeleteButton';
import { avatarCell, distanceFromNowCell } from './components/gridCells';
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

export const defaultParams = {
  ccRelatedUsers: {},
  getExperimentById: {},
  getExperimentList: {
    type: 'comparison',
    key: 'fuffa',
    // this is the default as per 'yarn backend watch'
  },
  personalHomes: {},
  personalSearches: {},
  personalVideos: {},
  personalAds: {},
  tikTokPersonalHTMLSummary: {},
  tikTokPersonalMetadataSummary: {},
  tikTokSearches: {},
};

// eslint-disable-next-line react/display-name
const makeTextInput = ({label, key }: { label: string, key: string, }) => (
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
        label={label}
        inputMode="text"
        control={
          <Input
            name={key}
            value={params[key] ?? ''}
            onChange={(e) =>
              setParams({ ...params, [key]: e.target.value })
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
            value={params.publicKey ?? ''}
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
      inputs: makeTextInput({ label: 'Channel ID', key: 'channelId' }),
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
      inputs: makeTextInput({ label: 'Experiment ID', key: 'experimentId' }),
      columns: [
        {
          field: 'savingTime',
          headerName: 'savingTime',
          minWidth: 400,
          renderCell: distanceFromNowCell
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
          renderCell: distanceFromNowCell
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
          renderCell: distanceFromNowCell,
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
          renderCell: distanceFromNowCell
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
    tikTokPersonalHTMLSummary: {
      inputs: publicKeyInput,
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
          renderCell: distanceFromNowCell
        },
      ],
    },
    tikTokPersonalMetadataSummary: {
      inputs: publicKeyInput,
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
      inputs: publicKeyInput,
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
          renderCell: avatarCell,
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
          renderCell: distanceFromNowCell
        },
        {
          field: 'publishingDate',
          renderCell: distanceFromNowCell
        },
      ],
    },
  };
};
