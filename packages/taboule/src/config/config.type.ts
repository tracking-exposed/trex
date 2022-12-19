import { DataGridProps, GridColTypeDef } from '@mui/x-data-grid';
import { EndpointQuery, Results } from '../state/queries';
import { ExpandViewProps } from '../components/expand-view/ExpandView';
import { TabouleCommands } from '../state/commands';
import * as tkEndpoints from '@tktrex/shared/endpoints';
import * as ytEndpoints from '@yttrex/shared/endpoints';
import { APIClient } from '@shared/providers/api.provider';

export interface TabouleColumnProps<K> extends Omit<GridColTypeDef, 'field'> {
  field: K | 'actions';
}

/**
 * The Taboule query configuration object
 *
 * @typeParam P - the data type to handle
 * @typeParam I - the input type for query
 * @typeParam O - the output object
 */
export interface TabouleQueryConfiguration<
  P extends Record<string, any>,
  I extends {},
  O
> extends Omit<DataGridProps, 'columns' | 'rows'> {
  columns: Array<TabouleColumnProps<keyof P>>;
  inputs?: (params: any, setParams: React.Dispatch<any>) => JSX.Element;
  filters?: Record<string, string>;
  expanded?: (r: Omit<ExpandViewProps, 'data'> & { row: P }) => JSX.Element;
  actions?: (filters: any) => JSX.Element;
  query: EndpointQuery<I, O>;
}

/**
 * API Clients for our backends
 */
export interface APIClients {
  TK: APIClient<typeof tkEndpoints>;
  YT: APIClient<typeof ytEndpoints>;
}

export interface GetTabouleQueryConfOpts {
  clients: APIClients;
  commands: TabouleCommands;
  params: any;
}

/**
 * Get taboule query configuration.
 *
 */
export type GetTabouleQueryConf<
  P extends Record<string, any>,
  I extends {},
  O = Results<P>
> = (opts: GetTabouleQueryConfOpts) => TabouleQueryConfiguration<P, I, O>;
