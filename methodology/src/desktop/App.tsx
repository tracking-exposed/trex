import {
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Grid,
  Input,
  makeStyles,
} from '@material-ui/core';
import { ipcRenderer } from 'electron';
import * as React from 'react';
import { v4 as uuid } from 'uuid';
import type { Config } from '../guardoni';
import OutputPanel, { OutputItem } from './OutputPanel';

const useStyles = makeStyles((theme) => ({
  container: {
    width: '100%',
    height: '100%',
  },
  formControl: {
    alignItems: 'flex-start',
    marginBottom: theme.spacing(2),
  },
}));

export const App: React.FC = () => {
  const classes = useStyles();
  const [config, setConfig] = React.useState<Config>({
    profileId: 'anonymous',
    auto: true,
    shadowban: false,
    experiment: 'd75f9eaf465d2cd555de65eaf61a770c82d59451',
    sourceUrl: '',
    evidenceTag: 'climate-change',
    headless: false,
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
        <FormGroup>
          <FormControlLabel
            label="Profile"
            className={classes.formControl}
            labelPlacement="top"
            control={
              <Input
                id="profile-path"
                aria-describedby="profile-path-text"
                value={config.profileId}
                fullWidth
                onChange={(e) =>
                  setConfig({
                    ...config,
                    profileId: e.target.value,
                  })
                }
              />
            }
          />

          <FormControlLabel
            label="Experiment"
            className={classes.formControl}
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
            className={classes.formControl}
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
            className={classes.formControl}
            label={'Automatic'}
            labelPlacement="top"
            control={
              <Checkbox
                id="automatic"
                checked={config.auto}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    auto: e.target.checked,
                  })
                }
              />
            }
          />

          <FormControlLabel
            className={classes.formControl}
            label={'Shadow Ban'}
            labelPlacement="top"
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
            className={classes.formControl}
            label={'Headless'}
            labelPlacement="top"
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
