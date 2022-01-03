import * as React from "react";
import * as ReactDOM from "react-dom";
import { ThemeProvider } from "@material-ui/core";
import { App } from "./App";
import { theme } from "./theme";
import debug from "debug";

const main = (): void => {
  debug.enable("@yttrex*");

  ReactDOM.render(
    <React.StrictMode>
      <ThemeProvider theme={theme}>
        <App />
      </ThemeProvider>
    </React.StrictMode>,
    document.getElementById("guardoni")
  );
};

main();
