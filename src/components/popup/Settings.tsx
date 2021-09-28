import { updateSettings } from '../../API/commands';
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
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const classes = useStyles();
  return (
    <>
      <FormHelperText>{t('title')}</FormHelperText>
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
            {t('settings:contentCreatorRecommendationLabel')}
            <Typography variant="caption" display="block">
              {t('settings:contentCreatorRecommendationHint')}
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
            {t('settings:communityRecommendationsLabel')}
            <Typography variant="caption" display="block">
              {t('settings:communityRecommendationsHint')}
            </Typography>
          </FormLabel>
        }
        labelPlacement="end"
      />
      <Divider className={classes.divider} />

      <FormHelperText>{t('statistics:title')}</FormHelperText>
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
              {t('settings:contributeToIndipendentStatsLabel')}
              <Typography variant="caption" display="block">
                {t('settings:contributeToIndipendentStatsHint')}
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
