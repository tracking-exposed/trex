import {
  DataGrid,
  DataGridProps,
  GridColTypeDef,
} from "@material-ui/data-grid";
import * as QR from "avenger/lib/QueryResult";
import { WithQueries } from "avenger/lib/react";
import * as React from "react";
import { ObservableQuery } from "avenger/lib/Query";
import {
  TabouleQueries,
  GetDataTableQueries,
  SearchQueryInput,
  Results,
} from "../state/queries";
import { ErrorBox } from "@shared/components/Error/ErrorBox";
import { ChannelRelated } from "@shared/models/ChannelRelated";
import { APIError } from "@shared/errors/APIError";

interface TabouleColumnProps<K> extends Omit<GridColTypeDef, "field"> {
  field: K;
}

interface TabouleQueryConfiguration<P extends Record<string, any>>
  extends Omit<DataGridProps, "columns" | "rows"> {
  columns: Array<TabouleColumnProps<keyof P>>;
}

interface TabouleConfiguration {
  ccRelatedUsers: TabouleQueryConfiguration<ChannelRelated>;
}

const defaultConfiguration: TabouleConfiguration = {
  ccRelatedUsers: {
    columns: [
      {
        field: "channelId",
        headerName: "Channel ID",
        minWidth: 160,
      },
      {
        field: "percentage",
        minWidth: 160,
      },
      {
        field: "recommendedChannelCount",
        minWidth: 160,
      },
    ],
  },
};

export interface TabouleProps<Q extends keyof TabouleQueries>
  extends Omit<DataGridProps, "rows" | "columns"> {
  query: Q;
  baseURL: string;
  defaultParams?: any;
  columns?: GridColTypeDef[];
}

export const Taboule = <Q extends keyof TabouleQueries>({
  query: queryKey,
  baseURL,
  defaultParams,
  ...props
}: TabouleProps<Q>): JSX.Element => {
  const config = React.useMemo(
    () => defaultConfiguration[queryKey],
    [queryKey]
  );
  const query: ObservableQuery<
    SearchQueryInput,
    APIError,
    Results<any>
  > = React.useMemo(
    () => GetDataTableQueries({ baseURL })[queryKey],
    [baseURL, queryKey]
  );

  const dataGridProps = {
    ...props,
    filterMode: "server",
    ...config,
  };

  return (
    <WithQueries
      queries={{ query: query }}
      params={{
        query: {
          Params: {
            ...defaultParams,
          },
          Query: {
            amount: 10,
            skip: 0,
          },
        },
      }}
      render={QR.fold(
        () => (
          <DataGrid {...dataGridProps} loading={true} rows={[]} />
        ),
        ErrorBox,
        ({ query: { content } }) => {
          return <DataGrid {...dataGridProps} rows={content} />;
        }
      )}
    />
  );
};
