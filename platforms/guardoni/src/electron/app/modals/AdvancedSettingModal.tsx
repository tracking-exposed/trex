import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  FormControlLabel,
  FormHelperText,
  Grid,
  Input,
  makeStyles,
} from '@material-ui/core';
import * as React from 'react';
import {
  getConfigPlatformKey,
  getPlatformConfig,
} from '../../../guardoni/config';
import { GuardoniConfig, PlatformConfig } from '../../../guardoni/types';

const useStyles = makeStyles((theme) => ({
  formControl: {
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    marginTop: theme.spacing(3),
    '& > .MuiFormControlLabel-label': { fontWeight: 600 },
  },
  formControlCheckbox: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    margin: 5,
  },
  formControlWithMarginBottom: {
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    margin: 0,
    marginBottom: theme.spacing(4),
  },
}));

const AdvancedSettingModal: React.FC<{
  open: boolean;
  config: GuardoniConfig;
  platform: PlatformConfig;
  onConfigChange: (c: GuardoniConfig) => void;
  onCancel: () => void;
}> = ({
  open,
  config: _config,
  platform: _platform,
  onConfigChange,
  onCancel,
}) => {
  const classes = useStyles();

  const [config, setConfig] = React.useState<GuardoniConfig>(_config);
  const platformKey = getConfigPlatformKey(_platform.name);
  const platform = getPlatformConfig(_platform.name, config);

  return (
    <Dialog open={open}>
      <Grid container style={{ marginBottom: 20 }}>
        <Grid item md={12}>
          <Box display="flex" flexDirection="column" width="100%">
            <FormControlLabel
              label="Backend"
              className={classes.formControl}
              labelPlacement="top"
              control={
                <Input
                  id="backend"
                  aria-describedby="backend-text"
                  value={platform.backend}
                  fullWidth
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      [platformKey]: {
                        ...platform,
                        backend: e.target.value,
                      },
                    })
                  }
                />
              }
            />
            <FormHelperText>The backend url used by guardoni</FormHelperText>
            <FormControlLabel
              label="Base Path"
              className={classes.formControl}
              labelPlacement="top"
              control={
                <Input
                  id="profile-path"
                  aria-describedby="profile-path-text"
                  value={config.basePath}
                  fullWidth
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      basePath: e.target.value,
                    })
                  }
                />
              }
            />
            <FormHelperText>
              The base path used to compute all the others
            </FormHelperText>

            <FormControlLabel
              label="Extension"
              className={classes.formControl}
              labelPlacement="top"
              control={
                <Input
                  id="extension"
                  aria-describedby="extension-text"
                  value={platform.extensionDir}
                  fullWidth
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      [platformKey]: {
                        ...platform,
                        extensionDir: e.target.value,
                      },
                    })
                  }
                />
              }
            />
            <FormHelperText>The unpacked extension dir</FormHelperText>
            <FormControlLabel
              label="Chrome Path"
              className={classes.formControl}
              labelPlacement="top"
              control={
                <Input
                  id="backend"
                  aria-describedby="backend-text"
                  value={config.chromePath}
                  fullWidth
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      chromePath: e.target.value,
                    })
                  }
                />
              }
            />
            <FormHelperText style={{ marginBottom: 40 }}>
              Chrome executable path
            </FormHelperText>
          </Box>
        </Grid>
        <Grid item md={12} style={{ display: 'flex', flexDirection: 'row' }}>
          <FormControlLabel
            className={classes.formControlCheckbox}
            label={'Headless'}
            labelPlacement="end"
            control={
              <Checkbox
                checked={config.headless}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    headless: e.target.checked,
                  })
                }
              />
            }
          />

          <FormControlLabel
            className={classes.formControlCheckbox}
            label={'Verbose'}
            labelPlacement="end"
            control={
              <Checkbox
                checked={config.verbose}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    verbose: e.target.checked,
                  })
                }
              />
            }
          />
        </Grid>
      </Grid>
      <DialogActions>
        <Button onClick={() => onCancel()}>Cancel</Button>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            onConfigChange(config);
            onCancel();
          }}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdvancedSettingModal;
