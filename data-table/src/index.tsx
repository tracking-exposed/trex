import * as React from "react";
import * as ReactDOM from "react-dom";
import { ThemeProvider, createTheme } from "@material-ui/core";
import { Table } from "./components/Table";

interface DataTableProps {
  node: HTMLDivElement;
}

export const DataTable = (props: DataTableProps): void => {
  const theme = createTheme();

  ReactDOM.render(
    <ThemeProvider theme={theme}>
      <Table query="ccRelatedUsers" baseURL="http://localhost:9000/api" />
    </ThemeProvider>,
    props.node
  );
};

DataTable({ node: document.getElementById("main") as any });
