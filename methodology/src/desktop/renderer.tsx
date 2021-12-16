import * as React from "react";
import * as ReactDOM from "react-dom";
import { ThemeProvider } from "@material-ui/core";
import { Renderer } from "./App";
import { theme } from "./theme";

ReactDOM.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <Renderer />
    </ThemeProvider>
  </React.StrictMode>,
  document.getElementById("guardoni")
);
