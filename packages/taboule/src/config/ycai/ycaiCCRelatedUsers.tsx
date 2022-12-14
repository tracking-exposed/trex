import { APIError } from '@shared/errors/APIError';
import { ChannelRelated } from '@shared/models/ChannelRelated';
import { queryStrict, available } from 'avenger';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import { Results, SearchRequestInput } from '../../state/queries';
import { GetTabouleQueryConf } from '../config.type';
import { columnDefault } from '../defaults';
import * as inputs from '../inputs';

type QueryInput = Omit<SearchRequestInput, 'Params'> & {
  Params: { channelId: string };
};

/**
 * YCAI Related users taboule query configuration
 *
 * Columns:
 *  - id
 *  - recommendedSource
 *  - percentage
 *  - recommendedChannelCount
 *  - savingTime
 *  - experimentId
 *  - researchTag
 
 *
 * @param opts - Taboule query options {@link GetTabouleQueryConfOpts}
 * @returns taboule query configuration for YCAI related users
 */
export const YCAIccRelatedUsers: GetTabouleQueryConf<
  ChannelRelated,
  QueryInput
> = ({ clients, commands, params }) => ({
  getRowId: (d) => d.id ?? d.recommendedSource ?? d.percentage,
  inputs: inputs.channelIdInput,
  query: queryStrict<QueryInput, APIError, Results<ChannelRelated>>(
    (input) =>
      pipe(
        clients.YT.v3.Creator.CreatorRelatedChannels({
          ...input,
          Headers: {
            'x-authorization': params.accessToken ?? '',
          },
        }),
        TE.map(({ totalRecommendations, ...r }) => ({
          ...r,
          total: totalRecommendations,
        }))
      ),
    available
  ),
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
      valueFormatter: (p: any) => `${p.value}%`,
    },
    {
      ...columnDefault,
      field: 'recommendedChannelCount',
      minWidth: 160,
    },
  ],
});
