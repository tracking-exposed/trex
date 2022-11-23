import { DataGridProps, GridColTypeDef } from '@mui/x-data-grid';
import { ExpandViewProps } from '../components/expand-view/ExpandView';
import { TabouleCommands } from '../state/commands';

export interface TabouleColumnProps<K> extends Omit<GridColTypeDef, 'field'> {
  field: K | 'actions';
}

export interface TabouleQueryConfiguration<P extends Record<string, any>>
  extends Omit<DataGridProps, 'columns' | 'rows'> {
  columns: Array<TabouleColumnProps<keyof P>>;
  inputs?: (params: any, setParams: React.Dispatch<any>) => JSX.Element;
  filters?: Record<string, string>;
  expanded?: (r: Omit<ExpandViewProps, 'data'> & { row: P }) => JSX.Element;
  actions?: () => JSX.Element;
}

export type GetTabouleQueryConf<P extends Record<string, any>> = (
  commands: TabouleCommands,
  params: any
) => TabouleQueryConfiguration<P>;
