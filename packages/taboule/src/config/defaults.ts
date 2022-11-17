import { GridColTypeDef } from '@mui/x-data-grid';
import * as cells from '../components/gridCells';

/**
 * The default column width
 *
 */
export const columnDefault: Partial<GridColTypeDef> = {
  // 200px seems a reasonable width default
  minWidth: 200,
  // we want not filterable columns as default
  filterable: false,
};

export const fieldsDefaultHead: any[] = [
  {
    ...columnDefault,
    field: 'id' as const,
    minWidth: 40,
  },
];

export const fieldsDefaultTail = [
  {
    ...columnDefault,
    field: 'savingTime' as const,
    renderCell: cells.distanceFromNowCell,
  },
  {
    ...columnDefault,
    field: 'experimentId' as const,
    headerName: 'experimentId',
    filterable: true,
    minWidth: 400,
  },
  {
    ...columnDefault,
    field: 'researchTag' as const,
    headerName: 'Research Tag',
    filterable: true,
  },
];
