import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  Input,
  InputLabel,
} from "@material-ui/core";
import { ipcRenderer } from "electron";
import * as React from "react";

interface Config {
  profileDir: string;
  extensionDir: string;
}

export const App: React.FC = () => {
  const [config, setConfig] = React.useState<Config>({
    profileDir: `~/guardoni/profiles/anonymous`,
    extensionDir: `~/guardoni/extension`,
  });

  const [guardoniError, setGuardoniError] = React.useState<Error | null>(null);

  const startGuardoni = (): void => {
    console.log('start guardoni', config);
    void ipcRenderer.send('startGuardoni', config);
    // void pie
    //   .run(electron.app, {
    //     headless: true,
    //     width: 1000,
    //     height: 600,
    //     extensionDir: config.extensionDir,
    //   })()
    //   .then((result) => {
    //     if (result._tag === "Left") {
    //       console.error(result);
    //       setGuardoniError(result.left);
    //     }
    //   });
  };

  return (
    <Box maxWidth={"100%"}>
      <FormControl>
        <InputLabel htmlFor="profile-path">Profile path</InputLabel>
        <Input
          id="profile-path"
          aria-describedby="profile-path-text"
          value={config.profileDir}
          onChange={(e) =>
            setConfig({
              ...config,
              profileDir: e.target.value,
            })
          }
        />
        <FormHelperText id="profile-path-text">
          User profile path
        </FormHelperText>
      </FormControl>
      <FormControl>
        <InputLabel htmlFor="my-input">Browser extension path</InputLabel>
        <Input
          id="my-input"
          aria-describedby="my-helper-text"
          value={config.extensionDir}
          onChange={(e) =>
            setConfig({
              ...config,
              extensionDir: e.target.value,
            })
          }
        />
        <FormHelperText id="my-helper-text">
          Browser extension path
        </FormHelperText>
      </FormControl>
      <FormControl>
        <Button
          onClick={() => {
            void startGuardoni();
          }}
        >
          Start guardoni
        </Button>
      </FormControl>

      {guardoniError ? (
        <Box color="error" maxWidth={"100%"}>
          <h3>{guardoniError.message}</h3>
          <pre style={{ maxWidth: "100%" }}>{guardoniError.stack}</pre>
        </Box>
      ) : null}
    </Box>
  );
};
