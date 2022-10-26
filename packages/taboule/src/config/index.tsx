import { Box } from '@material-ui/core';
import { DataGridProps, GridColTypeDef } from '@mui/x-data-grid';
import { ChannelRelated } from '@shared/models/ChannelRelated';
import {
  VideoMetadata as YTVideoMetadata,
  HomeMetadata as YTHomeMetadata,
  SearchMetadata as YTSearchMetadata,
  Metadata as YTMetadata,
} from '@yttrex/shared/models/metadata/Metadata';
import {
  SummaryHTMLMetadata,
  // SummaryMetadata,
} from '@shared/models/contributor/ContributorPersonalSummary';
import { GuardoniExperiment } from '@shared/models/Experiment';
import {
  ForYouMetadata as TKForYouMetadata,
  NativeMetadata as TikTokNativeMetadata,
  ProfileMetadata as TKProfileMetadata,
  SearchMetadata as TikTokSearchMetadata,
} from '@tktrex/shared/models/metadata';
import * as React from 'react';
import CSVDownloadButton from '../components/buttons/CSVDownloadButton';
import DeleteButton from '../components/buttons/DeleteButton';
import * as cells from '../components/gridCells';
import { TabouleCommands } from '../state/commands';
import * as actions from './actions';
import * as inputs from './inputs';
import * as params from './params';

export interface TabouleColumnProps<K> extends Omit<GridColTypeDef, 'field'> {
  field: K | 'actions';
}

export interface TabouleQueryConfiguration<P extends Record<string, any>>
  extends Omit<DataGridProps, 'columns' | 'rows'> {
  columns: Array<TabouleColumnProps<keyof P>>;
  inputs?: (params: any, setParams: React.Dispatch<any>) => JSX.Element;
  actions?: () => JSX.Element;
}

interface TabouleConfiguration {
  YCAIccRelatedUsers: TabouleQueryConfiguration<ChannelRelated>;
  youtubeGetExperimentById: TabouleQueryConfiguration<YTMetadata>;
  youtubeGetExperimentList: TabouleQueryConfiguration<GuardoniExperiment>;
  youtubePersonalAds: TabouleQueryConfiguration<{}>;
  youtubePersonalHomes: TabouleQueryConfiguration<YTHomeMetadata>;
  youtubePersonalSearches: TabouleQueryConfiguration<YTSearchMetadata>;
  youtubePersonalVideos: TabouleQueryConfiguration<YTVideoMetadata>;
  tikTokPersonalHTMLSummary: TabouleQueryConfiguration<SummaryHTMLMetadata>;
  tikTokPersonalSearch: TabouleQueryConfiguration<TikTokSearchMetadata>;
  tikTokPersonalNative: TabouleQueryConfiguration<TikTokNativeMetadata>;
  tikTokPersonalProfile: TabouleQueryConfiguration<TKProfileMetadata>;
  tikTokPersonalForYou: TabouleQueryConfiguration<TKForYouMetadata>;
}

const columnDefault: Partial<GridColTypeDef> = {
  minWidth: 200,
};

export const defaultConfiguration = (
  commands: TabouleCommands,
  params: any
): TabouleConfiguration => {
  return {
    YCAIccRelatedUsers: {
      getRowId: (d) => d.id ?? d.recommendedSource ?? d.percentage,
      inputs: inputs.channelIdInput,
      columns: [
        {
          ...columnDefault,
          field: 'recommendedSource',
          headerName: 'Recommended Source',
          minWidth: 160,
        },
        {
          ...columnDefault,
          field: 'percentage',
          minWidth: 160,
          valueFormatter: (p) => `${p.value}%`,
        },
        {
          ...columnDefault,
          field: 'recommendedChannelCount',
          minWidth: 160,
        },
      ],
    },
    youtubeGetExperimentById: {
      inputs: inputs.experimentIdInput,
      columns: [
        {
          ...columnDefault,
          field: 'savingTime',
          headerName: 'savingTime',
          minWidth: 400,
          renderCell: cells.distanceFromNowCell,
        },
      ],
    },
    youtubeGetExperimentList: {
      columns: [
        {
          ...columnDefault,
          field: 'experimentId',
          headerName: 'experimentId',
          minWidth: 400,
        },
        {
          ...columnDefault,
          field: 'when',
          headerName: 'Registered',
          renderCell: cells.distanceFromNowCell,
        },
        {
          ...columnDefault,
          field: 'steps',
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
    youtubePersonalSearches: {
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
          ...columnDefault,
          field: 'id',
          minWidth: 200,
        },
        {
          ...columnDefault,
          field: 'savingTime',
          renderCell: cells.distanceFromNowCell,
        },
        {
          ...columnDefault,
          field: 'query',
        },
        {
          ...columnDefault,
          field: 'experimentId',
          headerName: 'experimentId',
          minWidth: 400,
        },
        {
          ...columnDefault,
          field: 'actions',
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
    youtubePersonalVideos: {
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
          ...columnDefault,
          field: 'title',
        },
        {
          ...columnDefault,
          field: 'authorName',
        },
        {
          ...columnDefault,
          field: 'authorSource',
        },
        {
          ...columnDefault,
          field: 'savingTime',
          renderCell: cells.distanceFromNowCell,
        },
        {
          ...columnDefault,
          field: 'experimentId',
          headerName: 'experimentId',
          minWidth: 400,
        },
        {
          ...columnDefault,
          field: 'actions',
          renderCell: actions.personalMetadataActions(commands, params),
        },
      ],
    },
    youtubePersonalAds: {
      inputs: inputs.publicKeyInput,
      columns: [],
    },
    youtubePersonalHomes: {
      inputs: inputs.publicKeyInput,
      columns: [
        {
          ...columnDefault,
          field: 'id',
          minWidth: 100,
        },
        {
          ...columnDefault,
          field: 'savingTime',
          renderCell: cells.distanceFromNowCell,
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
          field: 'login',
          minWidth: 100,
        },
        {
          ...columnDefault,
          field: 'actions',
          renderCell: actions.personalMetadataActions(commands, params),
        },
      ],
    },
    tikTokPersonalNative: {
      inputs: inputs.publicKeyInput,
      columns: [
        {
          ...columnDefault,
          field: 'id',
        },
        {
          ...columnDefault,
          field: 'authorId',
        },
        {
          ...columnDefault,
          field: 'videoId',
          renderCell: (params) => {
            return <a href="">{params.row.videoId}</a>;
          },
        },
        {
          ...columnDefault,
          field: 'hashtags',
          renderCell: (params) => {
            const hashtags = params.row.hashtags ?? [];
            return <span>{hashtags.join(',')}</span>;
          },
        },
      ],
    },

    tikTokPersonalForYou: {
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
          ...columnDefault,
          field: 'id',
          width: 40,
          renderCell: (params) => {
            const longId = params.formattedValue;
            const shortId = (longId as string).substr(0, 7);
            return (
              <a href={`/details/#${encodeURI(longId as string)}`}>{shortId}</a>
            );
          },
        },
        {
          ...columnDefault,
          field: 'author',
          renderCell: (params) => {
            if (params.value) {
              return (
                <a
                  href={`/search/#${encodeURI(
                    params.formattedValue.username as string
                  )}`}
                >
                  {params.formattedValue.username}
                </a>
              );
            }
            return '-';
          },
        },
        {
          ...columnDefault,
          field: 'savingTime',
          headerName: 'when',
          renderCell: cells.distanceFromNowCell,
        },
      ],
    },
    tikTokPersonalProfile: {
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
          ...columnDefault,
          field: 'id',
          width: 40,
          renderCell: (params) => {
            const longId = params.formattedValue;
            const shortId = (longId as string).substr(0, 7);
            return (
              <a href={`/details/#${encodeURI(longId as string)}`}>{shortId}</a>
            );
          },
        },
        {
          ...columnDefault,
          field: 'savingTime',
          headerName: 'when',
          renderCell: cells.distanceFromNowCell,
        },
        // {
        //   ...columnDefault,
        //   field: 'rejected',
        //   headerName: 'was answered?',
        //   width: 40,
        //   renderCell: (params) => {
        //     return <span>{params.formattedValue === true ? '🚫' : '✔️'}</span>;
        //   },
        // },
        {
          ...columnDefault,
          field: 'results',
          renderCell: (params) => {
            return <span>{params.row.results.length}</span>;
          },
          width: 40,
        },
        // {
        //   ...columnDefault,
        //   field: 'sources',
        // },
      ],
    },
    tikTokPersonalSearch: {
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
          ...columnDefault,
          field: 'id',
          width: 40,
          renderCell: (params) => {
            const longId = params.formattedValue;
            const shortId = (longId as string).substr(0, 7);
            return (
              <a href={`/details/#${encodeURI(longId as string)}`}>{shortId}</a>
            );
          },
        },
        {
          ...columnDefault,
          field: 'query',
          renderCell: (params) => {
            return (
              <a
                href={`/search/#${encodeURI(params.formattedValue as string)}`}
              >
                {params.formattedValue}
              </a>
            );
          },
        },
        {
          ...columnDefault,
          field: 'savingTime',
          headerName: 'when',
          renderCell: cells.distanceFromNowCell,
        },
        {
          ...columnDefault,
          field: 'results',
          renderCell: (params) => {
            return <span>{params.row.results.length}</span>;
          },
          width: 40,
        },
      ],
    },
    tikTokPersonalHTMLSummary: {
      inputs: inputs.publicKeyInput,
      columns: [
        {
          ...columnDefault,
          field: 'id',
        },
        {
          ...columnDefault,
          field: 'timelineId',
        },
        {
          ...columnDefault,
          field: 'href',
        },
        {
          ...columnDefault,
          field: 'savingTime',
          renderCell: cells.distanceFromNowCell,
        },
      ],
    },
    // tikTokSearches: {
    //   /* this taboule hasn't the CSV allowed nor supported, because
    //    * it got only a portion of all the searches = the many that
    //    * have been searched from two users + do not return any rejection */
    //   columns: [
    //     {
    //       ...columnDefault,
    //       field: 'id',
    //     },
    //     {
    //       ...columnDefault,
    //       field: 'query',
    //       renderCell: (params) => {
    //         return (
    //           <a
    //             href={`/search/#${encodeURI(params.formattedValue as string)}`}
    //           >
    //             {params.formattedValue}
    //           </a>
    //         );
    //       },
    //     },
    //     // {
    //     //   ...columnDefault,
    //     //   field: 'thumbnails',
    //     //   renderCell: cells.avatarCell,
    //     // },
    //     {
    //       ...columnDefault,
    //       field: 'savingTime',
    //       renderCell: cells.distanceFromNowCell,
    //     },
    //   ],
    // },
  };
};

export { actions, inputs, params };
