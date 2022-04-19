import {
  Dialog,
  Grid,
  Accordion,
  AccordionSummary,
  Box,
  FormControlLabel,
  Input,
  makeStyles,
  FormHelperText,
  Button,
  AccordionDetails,
  Checkbox,
  DialogActions,
} from '@material-ui/core';
import { ipcRenderer } from 'electron';
import { EVENTS } from '../../models/events';
import { GuardoniConfigRequired } from '../../../guardoni/types';
import * as React from 'react';

const useStyles = makeStyles((theme) => ({
  formGroup: {
    margin: theme.spacing(2),
  },
  formControl: {
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    margin: 0,
  },
  formControlCheckbox: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    margin: 0,
  },
  formControlWithMarginBottom: {
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    margin: 0,
    marginBottom: theme.spacing(4),
  },
  formHelperText: {
    marginBottom: theme.spacing(4),
  },
}));

const AdvancedSettingModal: React.FC<{
  open: boolean;
  config: GuardoniConfigRequired;
  onConfigChange: (c: GuardoniConfigRequired) => void;
  onSubmit: () => void;
  onCancel: () => void;
}> = ({ open, config, onConfigChange, onCancel }) => {
  const classes = useStyles();

  const handleOpenProfileDir = React.useCallback(
    (config: GuardoniConfigRequired) => {
      ipcRenderer.send(
        EVENTS.OPEN_GUARDONI_DIR.value,
        `${config.basePath}/profiles/${config.profileName}`
      );
    },
    [config]
  );

  return (
    <Dialog open={open}>
      <Grid container style={{ marginBottom: 40 }}>
        <Grid item md={12}>
          <Accordion>
            <AccordionSummary>
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
                        onConfigChange({
                          ...config,
                          profileName: e.target.value,
                        })
                      }
                    />
                  }
                />
                <FormHelperText className={classes.formHelperText}>
                  The profile data will be stored in {config.basePath}
                  /profiles/{config.profileName}
                  <Button
                    size="small"
                    color="primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenProfileDir(config);
                    }}
                  >
                    Open Profile Folder
                  </Button>
                </FormHelperText>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box display="flex" flexDirection="column" width="100%">
                <FormControlLabel
                  label="Evidence Tag"
                  className={`${classes.formControl} ${classes.formControlWithMarginBottom}`}
                  labelPlacement="top"
                  control={
                    <Input
                      id="evidence-tag-input"
                      value={config.evidenceTag}
                      fullWidth
                      onChange={(e) =>
                        onConfigChange({
                          ...config,
                          evidenceTag: e.target.value,
                        })
                      }
                    />
                  }
                />
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
                        onConfigChange({
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
                  label="Backend"
                  className={classes.formControl}
                  labelPlacement="top"
                  control={
                    <Input
                      id="backend"
                      aria-describedby="backend-text"
                      value={config.platform.backend}
                      fullWidth
                      onChange={(e) =>
                        onConfigChange({
                          ...config,
                          platform: {
                            ...config.platform,
                            backend: e.target.value,
                          },
                        })
                      }
                    />
                  }
                />
                <FormHelperText>
                  The backend url used by guardoni
                </FormHelperText>

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
                        onConfigChange({
                          ...config,
                          chromePath: e.target.value,
                        })
                      }
                    />
                  }
                />
                <FormHelperText>Chrome executable path</FormHelperText>
              </Box>
            </AccordionDetails>
          </Accordion>
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
                  onConfigChange({
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
                  onConfigChange({
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
      </DialogActions>
    </Dialog>
  );
};

export default AdvancedSettingModal;