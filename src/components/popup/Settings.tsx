import { updateSettings } from 'API/commands';
import {
  FormHelperText,
  FormLabel,
  Typography,
  Divider,
  makeStyles,
} from '@material-ui/core';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';
import * as React from 'react';
import { AccountSettings } from '../../models/AccountSettings';

const useStyles = makeStyles((theme) => ({
  divider: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(2),
  },
}));

interface SettingsProps {
  settings: AccountSettings;
}

const Settings: React.FC<SettingsProps> = ({ settings }) => {
  const classes = useStyles();
  return (
    <>
      <FormHelperText>YouChoose AI</FormHelperText>
      <FormControlLabel
        disabled={!settings.active}
        control={
          <Switch
            aria-labelledby="switch-recommendations"
            color="primary"
            checked={settings.ccRecommendations}
            onChange={(e, checked) =>
              updateSettings({ ...settings, ccRecommendations: checked })()
            }
          />
        }
        label={
          <FormLabel>
            Content Creator Recommendations
            <Typography variant="caption" display="block">
              See what video author are suggesting
            </Typography>
          </FormLabel>
        }
        labelPlacement="end"
      />
      <FormControlLabel
        disabled={true}
        control={
          <Switch
            aria-labelledby="switch-recommendations"
            color="primary"
            checked={settings.communityRecommendations}
            onChange={(e, checked) =>
              updateSettings({
                ...settings,
                communityRecommendations: checked,
              })()
            }
          />
        }
        label={
          <FormLabel>
            Community Recommendations
            <Typography variant="caption" display="block">
              Coming soon
            </Typography>
          </FormLabel>
        }
        labelPlacement="end"
      />
      <Divider className={classes.divider} />

      <FormHelperText>Statistics</FormHelperText>
      <FormControl component="fieldset">
        <FormControlLabel
          disabled={!settings.active}
          control={
            <Switch
              aria-labelledby="switch-stats"
              color="primary"
              checked={settings.stats}
              onChange={(e, b) => updateSettings({ ...settings, stats: b })()}
            />
          }
          label={
            <FormLabel>
              Contribute to indipendent stats
              <Typography variant="caption" display="block">
                Donate anonymously what Youtube recommends you
              </Typography>
            </FormLabel>
          }
          labelPlacement="end"
        />
      </FormControl>
    </>
  );
};

export default Settings;
