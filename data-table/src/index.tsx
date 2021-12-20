import * as React from "react";
import * as ReactDOM from "react-dom";
import { ThemeProvider, createTheme } from "@material-ui/core";
import { Table, TableProps } from "./components/Table";
import { DataTableQueries } from "state/queries";

interface DataTableProps<Q extends keyof DataTableQueries>
  extends TableProps<Q> {
  node: HTMLDivElement;
}

const DataTable = <Q extends keyof DataTableQueries>({
  node,
  ...props
}: DataTableProps<Q>): void => {
  const theme = createTheme();

  ReactDOM.render(
    <ThemeProvider theme={theme}>
      <Table {...props} />
    </ThemeProvider>,
    node
  );
};

export default DataTable;
