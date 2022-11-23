import { Box, Divider, Typography } from '@mui/material';
import {
  DataGrid,
  DataGridProps,
  GridColTypeDef,
  GridEventListener,
  GridFilterModel,
  GridFooter,
  GridLinkOperator,
  GridToolbarQuickFilter,
} from '@mui/x-data-grid';
import { toValidationError } from '@shared/errors/ValidationError';
import { GetLogger } from '@shared/logger';
import { TKMetadata } from '@tktrex/shared/models';
import { Metadata } from '@yttrex/shared/models/metadata/Metadata';
import * as QR from 'avenger/lib/QueryResult';
import { WithQueries } from 'avenger/lib/react';
import debug from 'debug';
import * as E from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';
import * as t from 'io-ts';
import * as React from 'react';
import * as config from '../config';
import { TabouleDataProvider } from '../state';
import {
  EndpointQuery,
  SearchRequestInput,
  TabouleQueries,
} from '../state/queries';
import { TabouleQueryKey } from '../state/types';
import RefreshButton from './buttons/RefreshButton';
import { ErrorOverlay } from './ErrorOverlay';
import './Taboule.css';

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

enum ExpandableActionType {
  SHOW_MODAL = 'SHOW_MODAL',
  CLOSE_MODAL = 'CLOSE_MODAL',
}
interface ExpandableAction {
  type: ExpandableActionType;
  payload: TKMetadata.TKMetadata | Metadata;
}

interface InvisibleExpandableState {
  isVisible: false;
  row: undefined;
}
type ExpandableState =
  | {
      isVisible: true;
      row: TKMetadata.TKMetadata | Metadata;
    }
  | InvisibleExpandableState;

export const Taboule = <Q extends keyof TabouleQueries>({
  height = 600,
  ...props
}: TabouleProps<Q>): JSX.Element => {
  const propsValidation = validateProps(props);

  if (propsValidation._tag === 'Left') {
    throw toValidationError('Taboule props are invalid', propsValidation.left);
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
  const [filterModel, setFilterModel] = React.useState<GridFilterModel>({
    items: [],
    quickFilterLogicOperator: GridLinkOperator.Or,
  });

  const tabouleQueries = React.useMemo(
    () => TabouleDataProvider(baseURL),
    [baseURL]
  );
  const query: EndpointQuery<SearchRequestInput, any> = tabouleQueries.queries[
    queryKey
  ] as any;

  const { inputs, filters, expanded, ...queryConfig } = React.useMemo(
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

  const handlePageChange = React.useCallback((page: number, details: any) => {
    setPage(page);
  }, []);

  const dataGridProps: DataGridProps = {
    ...otherProps,
    page,
    filterMode: 'server',
    ...queryConfig,
    onFilterModelChange(model, details) {
      setFilterModel(model);
    },

    filterModel,
    rows: [],
    rowsPerPageOptions: [25, 50, 100],
    initialState: {
      pagination: {
        page: 0,
      },
    },
    pageSize,
    paginationMode: 'server',
    pagination: true,
    componentsProps: {
      toolbar: {
        showQuickFilter: true,
        quickFilterProps: {
          debounceMs: 500,
        },
      },
    },
    components: {
      ErrorOverlay,
      Footer: (props) => {
        return (
          <Box display={'flex'} flexDirection="column" margin={2}>
            <Box>
              <GridFooter />
            </Box>
            <Divider style={{ marginBottom: 10 }} />
            <Typography>Taboule - v{process.env.VERSION}</Typography>
          </Box>
        );
      },
      ...(config.actions !== undefined
        ? {
            Toolbar: (props) => {
              return (
                <Box
                  style={{
                    display: 'flex',
                    alignContent: 'center',
                  }}
                >
                  <Box
                    margin={2}
                    style={{
                      display: 'flex',
                      flexGrow: 1,
                      alignItems: 'center',
                    }}
                  >
                    <GridToolbarQuickFilter {...props.quickFilterProps} />
                  </Box>

                  <Box
                    margin={2}
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      justifyContent: 'flex-end',
                      alignItems: 'center',
                    }}
                  >
                    <RefreshButton onClick={handleReload} />
                    {queryConfig.actions?.({ ...params, filter: filters })}
                  </Box>
                </Box>
              );
            },
          }
        : {}),
    },
  };

  log.debug(`Rendering with props %O`, dataGridProps);
  log.debug(`Query %s (%O) with params %O`, queryKey, query, params);

  const initialState: InvisibleExpandableState = {
    isVisible: false,
    row: undefined,
  };
  const infoReducerFn = (
    state: ExpandableState,
    action: ExpandableAction
  ): ExpandableState => {
    const { type, payload } = action;
    if (type === 'SHOW_MODAL') {
      return { isVisible: true, row: payload };
    }
    if (type === 'CLOSE_MODAL') {
      return initialState;
    }
    return state;
  };
  const [infoState, dispatchInfoState] = React.useReducer(
    infoReducerFn,
    initialState
  );

  const handleEvent: GridEventListener<'rowClick'> = (
    params // GridRowParams
  ) => {
    dispatchInfoState({
      type: ExpandableActionType.SHOW_MODAL,
      payload: params.row,
    });
  };

  const handleHideModal = (): void => {
    dispatchInfoState({
      type: ExpandableActionType.CLOSE_MODAL,
      payload: initialState.row as any,
    });
  };

  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);

  const handleReload = (): void => {
    forceUpdate();
  };

  const amount = pageSize;
  const skip = page * pageSize;

  const queryFilters = React.useMemo(() => {
    const currentFilter = filterModel.items.reduce(
      (acc, v) => ({ ...acc, [v.columnField]: v.value }),
      {}
    );

    return {
      ...filters,
      ...currentFilter,
    };
  }, [filterModel]);

  return (
    <Box height={height}>
      <div
        style={{
          position: 'relative',
          marginBottom: '30px',
        }}
      >
        {paramsInputs}
      </div>

      <WithQueries
        queries={{ query }}
        params={{
          query: {
            Params: params,
            Query: {
              publicKey: params.publicKey,
              amount,
              skip,
              filter: queryFilters,
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
                onRowClick={handleEvent}
              />
            );
          }
        )}
      />
      {infoState.row && expanded
        ? expanded({ ...(infoState as any), onClose: handleHideModal })
        : null}
    </Box>
  );
};
