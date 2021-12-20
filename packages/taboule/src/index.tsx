import * as React from "react";
import * as ReactDOM from "react-dom";
import { ThemeProvider, createTheme, Box, Typography } from "@material-ui/core";
import { Taboule, TabouleProps } from "./components/Taboule";
import { TabouleQueries } from "./state/queries";

interface DataTableProps<Q extends keyof TabouleQueries>
  extends TabouleProps<Q> {
  node: HTMLDivElement;
}

const appendTo = <Q extends keyof TabouleQueries>({
  node,
  ...props
}: DataTableProps<Q>): void => {
  const theme = createTheme();

  ReactDOM.render(
    <ThemeProvider theme={theme}>
      <Box>
        <Taboule {...props} />
        <Box>
          <Typography>v{process.env.VERSION}</Typography>
        </Box>
      </Box>
    </ThemeProvider>,
    node
  );
};

export default appendTo;
