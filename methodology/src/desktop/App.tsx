import * as React from "react";
import { Box, Button } from "@material-ui/core";
import { ipcRenderer } from "electron";

export const Renderer: React.FC = () => {
  const startGuardoni = (): void => {
    ipcRenderer.send("StartGuardoni", { type: "StartGuardoni" });
  };

  return (
    <Box>
      <Button
        onClick={() => {
          void startGuardoni();
        }}
      >
        Start guardoni
      </Button>
    </Box>
  );
};
