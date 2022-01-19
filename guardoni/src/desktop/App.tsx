import {
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  Grid,
  Input,
  makeStyles,
  Typography,
} from '@material-ui/core';
import { ipcRenderer } from 'electron';
import * as React from 'react';
import { v4 as uuid } from 'uuid';
import OutputPanel, { OutputItem } from './OutputPanel';

const useStyles = makeStyles((theme) => ({
  container: {
    width: '100%',
    height: '100%',
  },
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

export const App: React.FC = () => {
  const classes = useStyles();
  const [config, setConfig] = React.useState({
    profile: 'anonymous',
    evidenceTag: 'climate-change',
    headless: false,
    experiment: '',
    run: 'experiment',
    auto: '1',
    shadowban: true,
  });

  const [outputItems, setOutputItems] = React.useState<OutputItem[]>([]);

  const startGuardoni = async (): Promise<void> => {
    void ipcRenderer.send('startGuardoni', config);
  };

  React.useEffect(() => {
    ipcRenderer.on('guardoniError', (event, error) => {
      // eslint-disable-next-line no-console
      console.log('hereee', { event, error });
      setOutputItems(
        outputItems.concat({
          id: uuid(),
          level: 'Error',
          message: error.message,
        })
      );
    });

    ipcRenderer.on('guardoniOutput', (event, output) => {
      setOutputItems(
        outputItems.concat({
          id: uuid(),
          level: 'Info',
          ...output,
        })
      );
    });
  }, [outputItems]);

  return (
    <Grid container spacing={2} className={classes.container}>
      <Grid item md={6} sm={6}>
        <FormGroup className={classes.formGroup}>
          <Typography variant="h3">Guardoni</Typography>
          <Typography variant="caption" style={{ marginBottom: 40 }}>
            v{process.env.VERSION} - {process.env.NODE_ENV}
          </Typography>
          <FormControlLabel
            label="Profile"
            className={classes.formControl}
            labelPlacement="top"
            control={
              <Input
                id="profile-path"
                aria-describedby="profile-path-text"
                value={config.profile}
                fullWidth
                onChange={(e) =>
                  setConfig({
                    ...config,
                    profile: e.target.value,
                  })
                }
              />
            }
          />
          <FormHelperText className={classes.formHelperText}>
            The profile data will be stored in{' '}
            {`~/.config/guardoni/profiles/${config.profile}`}
          </FormHelperText>

          <FormControlLabel
            label="Experiment"
            className={classes.formControlWithMarginBottom}
            labelPlacement="top"
            control={
              <Input
                id="my-input"
                aria-describedby="my-helper-text"
                value={config.experiment}
                fullWidth
                onChange={(e) =>
                  setConfig({
                    ...config,
                    experiment: e.target.value,
                  })
                }
              />
            }
          />

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
                  setConfig({
                    ...config,
                    evidenceTag: e.target.value,
                  })
                }
              />
            }
          />

          <FormControlLabel
            className={classes.formControlCheckbox}
            label={'Automatic'}
            labelPlacement="end"
            control={
              <Checkbox
                id="automatic"
                checked={config.auto === '1'}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    auto: e.target.checked ? '1' : '2',
                  })
                }
              />
            }
          />

          <FormControlLabel
            className={classes.formControlCheckbox}
            label={'Shadow Ban'}
            labelPlacement="end"
            control={
              <Checkbox
                checked={config.shadowban}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    shadowban: e.target.checked,
                  })
                }
              />
            }
          />

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

          <Button
            color="primary"
            variant="contained"
            style={{ marginBottom: 20 }}
            onClick={() => {
              void startGuardoni();
            }}
          >
            Start guardoni
          </Button>
        </FormGroup>
      </Grid>
      <Grid item lg={6} md={6} sm={6}>
        <OutputPanel items={outputItems} />
      </Grid>
    </Grid>
  );
};