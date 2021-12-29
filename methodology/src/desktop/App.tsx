import {
  Box,
  Button,
  FormControlLabel,
  FormGroup,
  Input,
  makeStyles,
} from "@material-ui/core";
import { ipcRenderer } from "electron";
import * as React from "react";

const useStyles = makeStyles((theme) => ({
  container: {
    width: "100%",
    height: "100%",
  },
  formControl: {
    marginBottom: theme.spacing(2),
  },
}));

interface Config {
  profileDir: string;
  extensionDir: string;
}

export const App: React.FC = () => {
  const classes = useStyles();
  const [config, setConfig] = React.useState<Config>({
    profileDir: `~/guardoni/profiles/anonymous`,
    extensionDir: `~/guardoni/extension`,
  });

  const [guardoniError, setGuardoniError] = React.useState<Error | null>(null);

  const startGuardoni = async (): Promise<void> => {
    console.log("start guardoni", config);
    await ipcRenderer.send("startGuardoni", config);
  };

  React.useEffect(() => {
    ipcRenderer.on("guardoniError", (event, ...args) => {
      setGuardoniError(new Error("Guardoni failed"));
    });
  }, []);

  return (
    <Box className={classes.container}>
      <FormGroup>
        <FormControlLabel
          className={classes.formControl}
          label={"Profile path"}
          labelPlacement="top"
          control={
            <Input
              id="profile-path"
              aria-describedby="profile-path-text"
              value={config.profileDir}
              fullWidth
              onChange={(e) =>
                setConfig({
                  ...config,
                  profileDir: e.target.value,
                })
              }
            />
          }
        />

        <FormControlLabel
          className={classes.formControl}
          label="Browser extension path"
          labelPlacement="top"
          control={
            <Input
              id="my-input"
              aria-describedby="my-helper-text"
              value={config.extensionDir}
              fullWidth
              onChange={(e) =>
                setConfig({
                  ...config,
                  extensionDir: e.target.value,
                })
              }
            />
          }
        />

        <Button
          color="primary"
          onClick={() => {
            void startGuardoni();
          }}
        >
          Start guardoni
        </Button>
      </FormGroup>

      {guardoniError ? (
        <Box color="error" maxWidth={"100%"}>
          <h3>{guardoniError.message}</h3>
          <pre style={{ maxWidth: "100%" }}>{guardoniError.stack}</pre>
        </Box>
      ) : null}
    </Box>
  );
};
