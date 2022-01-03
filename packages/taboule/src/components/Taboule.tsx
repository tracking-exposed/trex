import {
  DataGrid,
  DataGridProps,
  GridColTypeDef,
} from '@material-ui/data-grid';
import { APIError } from '@shared/errors/APIError';
import { GetLogger } from '@shared/logger';
import { ChannelRelated } from '@shared/models/ChannelRelated';
import { Metadata } from '@shared/models/Metadata';
import { ObservableQuery } from 'avenger/lib/Query';
import * as QR from 'avenger/lib/QueryResult';
import { WithQueries } from 'avenger/lib/react';
import * as React from 'react';
import {
  GetDataTableQueries,
  Results,
  SearchRequestInput,
  TabouleQueries,
} from '../state/queries';
import { ErrorOverlay } from './ErrorOverlay';

const log = GetLogger('taboule');

interface TabouleColumnProps<K> extends Omit<GridColTypeDef, 'field'> {
  field: K;
}

interface TabouleQueryConfiguration<P extends Record<string, any>>
  extends Omit<DataGridProps, 'columns' | 'rows'> {
  columns: Array<TabouleColumnProps<keyof P>>;
}

interface TabouleConfiguration {
  ccRelatedUsers: TabouleQueryConfiguration<ChannelRelated>;
  compareExperiment: TabouleQueryConfiguration<Metadata>;
}

const defaultConfiguration: TabouleConfiguration = {
  ccRelatedUsers: {
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
};

export interface TabouleProps<Q extends keyof TabouleQueries>
  extends Omit<DataGridProps, 'rows' | 'columns'> {
  query: Q;
  baseURL: string;
  pageSize?: number;
  defaultParams?: any;
  columns?: GridColTypeDef[];
}

export const Taboule = <Q extends keyof TabouleQueries>({
  query: queryKey,
  baseURL,
  defaultParams,
  ...props
}: TabouleProps<Q>): JSX.Element => {
  const [page, setPage] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(props.pageSize ?? 25);
  const config = React.useMemo(
    () => defaultConfiguration[queryKey],
    [queryKey]
  );
  const query: ObservableQuery<
    SearchRequestInput,
    APIError,
    Results<any>
  > = React.useMemo(
    () => GetDataTableQueries({ baseURL })[queryKey],
    [baseURL, queryKey]
  );

  const handlePageSizeChange = React.useCallback((pageSize: number) => {
    setPageSize(pageSize);
  }, []);

  const handlePageChange = React.useCallback((page: number) => {
    setPage(page);
  }, []);

  const dataGridProps: DataGridProps = {
    ...props,
    page,
    filterMode: 'server',
    ...config,
    rows: [],
    rowsPerPageOptions: [5, 10, 25, 50],
    pageSize,
    paginationMode: 'server',
    components: {
      ErrorOverlay,
    },
  };

  log.debug(`Rendering with props %O`, dataGridProps);

  return (
    <WithQueries
      queries={{ query: query }}
      params={{
        query: {
          Params: {
            ...defaultParams,
          },
          Query: {
            amount: pageSize,
            skip: page * pageSize,
          },
        },
      }}
      render={QR.fold(
        () => (
          <DataGrid {...dataGridProps} loading={true} />
        ),
        (e) => (
          <DataGrid {...dataGridProps} error={e} />
        ),
        ({ query }) => {
          return (
            <DataGrid
              {...dataGridProps}
              page={page}
              rowCount={query.total}
              rows={query.content}
              onPageSizeChange={handlePageSizeChange}
              onPageChange={handlePageChange}
            />
          );
        }
      )}
    />
  );
};
