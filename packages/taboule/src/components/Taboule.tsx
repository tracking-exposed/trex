import { Box, Typography } from '@material-ui/core';
import {
  DataGrid,
  DataGridProps,
  GridColTypeDef,
} from '@material-ui/data-grid';
import { APIError } from '@shared/errors/APIError';
import { AppError } from '@shared/errors/AppError';
import { GetLogger } from '@shared/logger';
import { ObservableQuery } from 'avenger/lib/Query';
import * as QR from 'avenger/lib/QueryResult';
import { WithQueries } from 'avenger/lib/react';
import debug from 'debug';
import * as E from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';
import * as t from 'io-ts';
import { PathReporter } from 'io-ts/lib/PathReporter';
import * as React from 'react';
import * as config from '../config';
import { TabouleDataProvider } from '../state';
import { Results, SearchRequestInput, TabouleQueries } from '../state/queries';
import { TabouleQueryKey } from '../state/types';
import { ErrorOverlay } from './ErrorOverlay';

debug.enable(process.env.DEBUG ?? '');

const log = GetLogger('taboule');

const validateProps = <Q extends keyof TabouleQueries>(
  props: TabouleProps<Q>
): E.Either<t.Errors, TabouleProps<Q>> => {
  return pipe(
    TabouleQueryKey.decode(props.query),
    E.map((q) => ({
      ...props,
    }))
  );
};

export interface TabouleProps<Q extends keyof TabouleQueries>
  extends Omit<DataGridProps, 'rows' | 'columns'> {
  query: Q;
  showInput: boolean;
  baseURL: string;
  pageSize?: number;
  initialParams?: any;
  columns?: GridColTypeDef[];
  height?: number | string;
}

export const Taboule = <Q extends keyof TabouleQueries>({
  height = 600,
  ...props
}: TabouleProps<Q>): JSX.Element => {
  const propsValidation = validateProps(props);

  if (propsValidation._tag === 'Left') {
    // eslint-disable-next-line @typescript-eslint/no-throw-literal
    throw new AppError(
      'TabouleError',
      'Taboule props are invalid',
      PathReporter.report(propsValidation)
    );
  }

  const {
    initialParams,
    query: queryKey,
    baseURL,
    showInput,
    ...otherProps
  } = propsValidation.right;

  log.debug(`Initial params %O`, initialParams);

  const defaultQueryParams = React.useMemo(
    () => config.params.defaultParams[queryKey],
    [queryKey]
  );
  log.debug(`Default query params %O`, defaultQueryParams);

  const [params, setParams] = React.useState({
    ...defaultQueryParams,
    ...initialParams,
  });

  const [page, setPage] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(props.pageSize ?? 25);

  const tabouleQueries = React.useMemo(
    () => TabouleDataProvider(baseURL),
    [baseURL]
  );
  const query: ObservableQuery<
    SearchRequestInput,
    APIError,
    Results<any>
  > = tabouleQueries.queries[queryKey];

  const { inputs, ...queryConfig } = React.useMemo(
    () =>
      config.defaultConfiguration(tabouleQueries.commands, params)[queryKey],
    [queryKey, params]
  );

  const paramsInputs = React.useMemo(() => {
    if (showInput) {
      return inputs?.(params, setParams);
    }
    return null;
  }, [showInput, queryKey, params]);

  const handlePageSizeChange = React.useCallback((pageSize: number) => {
    setPageSize(pageSize);
  }, []);

  const handlePageChange = React.useCallback((page: number) => {
    setPage(page);
  }, []);

  const dataGridProps: DataGridProps = {
    ...otherProps,
    page,
    filterMode: 'server',
    ...queryConfig,
    rows: [],
    rowsPerPageOptions: [25, 50, 100],
    pageSize,
    paginationMode: 'server',
    components: {
      ErrorOverlay,
      Footer: () => {
        return (
          <Box margin={2}>
            <Typography>Taboule - v{process.env.VERSION}</Typography>
          </Box>
        );
      },
      ...(config.actions !== undefined
        ? {
            Toolbar: (props) => {
              return <Box margin={2}>{queryConfig.actions?.()}</Box>;
            },
          }
        : {}),
    },
  };

  log.debug(`Rendering with props %O`, dataGridProps);
  log.debug(`Query %s (%O) with params %O`, queryKey, query, params);

  return (
    <Box height={height}>
      {paramsInputs}
      <WithQueries
        queries={{ query }}
        params={{
          query: {
            Params: params,
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
    </Box>
  );
};
