import {
  Box,
  Button,
  Dialog,
  DialogActions,
  FormControlLabel,
  FormHelperText,
  Grid,
  Input,
  makeStyles,
} from '@material-ui/core';
import { ipcRenderer } from 'electron';
import * as React from 'react';
import { GuardoniConfig } from '../../../guardoni/types';
import { EVENTS } from '../../models/events';

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

const AddProfileModal: React.FC<{
  open: boolean;
  config: GuardoniConfig;
  onConfigChange: (c: GuardoniConfig) => void;
  onCancel: () => void;
}> = ({ open, config: _config, onConfigChange, onCancel }) => {
  const classes = useStyles();

  const [config, setConfig] = React.useState<GuardoniConfig>(_config);

  const handleOpenProfileDir = React.useCallback(
    (c: GuardoniConfig) => {
      ipcRenderer.send(
        EVENTS.OPEN_GUARDONI_DIR.value,
        `${c.basePath}/profiles/${c.profileName}`
      );
    },
    [config]
  );

  return (
    <Dialog open={open}>
      <Grid container style={{ marginBottom: 20 }}>
        <Grid item md={12}>
          <Box display="flex" flexDirection="column" width="100%">
            <FormControlLabel
              label="Profile"
              className={classes.formControl}
              labelPlacement="top"
              control={
                <Input
                  id="profile-path"
                  aria-describedby="profile-path-text"
                  value={config.profileName}
                  fullWidth
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      profileName: e.target.value,
                    })
                  }
                />
              }
            />
            <FormHelperText>
              The profile data will be stored in {config.basePath}
              /profiles/{config.profileName}
            </FormHelperText>
            <Box display="flex" flexDirection="row">
              <Button
                size="small"
                color="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenProfileDir(config);
                }}
                style={{ marginLeft: 12 }}
              >
                Open Profile Folder
              </Button>
            </Box>
          </Box>
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

export default AddProfileModal;
