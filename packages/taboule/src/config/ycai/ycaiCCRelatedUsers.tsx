import { ChannelRelated } from '@shared/models/ChannelRelated';
import { GetTabouleQueryConf } from '../config.type';
import { columnDefault } from '../defaults';
import * as inputs from '../inputs';

export const YCAIccRelatedUsers: GetTabouleQueryConf<ChannelRelated> = (
  commmands,
  params
) => ({
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
      valueFormatter: (p: any) => `${p.value}%`,
    },
    {
      ...columnDefault,
      field: 'recommendedChannelCount',
      minWidth: 160,
    },
  ],
});
