import {
  Box,
  Button,
  Divider,
  FormLabel,
  makeStyles,
  Typography,
} from '@material-ui/core';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import * as models from '../../models';
import { generateKeypair, updateSettings } from '../../state/public.commands';

const useStyles = makeStyles((theme) => ({
  divider: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(2),
  },
  smallTitle: {
    marginTop: 30,
    paddingBottom: 12,
  },
  noMargin: {
    marginLeft: 0,
    marginRight: 0,
  },
  marginRight: {
    marginRight: 15,
  },
}));

interface SettingsProps {
  settings: models.Settings.Settings;
}

const Settings: React.FC<SettingsProps> = ({ settings }) => {
  const { t } = useTranslation();
  const classes = useStyles();

  return (
    <>
      {/* <FormHelperText className={classes.smallTitle}>{t('recommendations:title')}</FormHelperText> */}
      <br />
      <FormControlLabel
        className={classes.noMargin}
        disabled={!settings.active}
        control={
          <Switch
            className={classes.marginRight}
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
            <Typography variant="h6">
              {t('settings:contentCreatorRecommendationLabel')}
            </Typography>
            <Typography variant="body2" display="block">
              {t('settings:contentCreatorRecommendationHint')}
            </Typography>
          </FormLabel>
        }
        labelPlacement="end"
      />
      <br />
      <br />
      <FormControlLabel
        className={classes.noMargin}
        disabled={true}
        control={
          <Switch
            className={classes.marginRight}
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
            <Typography variant="h6">
              {t('settings:communityRecommendationsLabel')}
            </Typography>
            <Typography variant="body2" display="block">
              {t('settings:communityRecommendationsHint')}
            </Typography>
          </FormLabel>
        }
        labelPlacement="end"
      />
      <br />
      <br />
      <Divider className={classes.divider} />

      <FormControl component="fieldset">
        <FormControlLabel
          className={classes.noMargin}
          disabled={!settings.active}
          control={
            <Switch
              className={classes.marginRight}
              aria-labelledby="switch-indipendentContributions"
              color="primary"
              checked={settings.indipendentContributions}
              onChange={(e, indipendentContributions) => {
                if (indipendentContributions) {
                  void generateKeypair({})();
                }

                void updateSettings({
                  ...settings,
                  indipendentContributions,
                })();
              }}
            />
          }
          label={
            <FormLabel>
              <Typography variant="h6">
                {t('settings:contributeToIndipendentStatsLabel')}
              </Typography>
              <Typography variant="body2" display="block">
                {t('settings:contributeToIndipendentStatsHint')}
              </Typography>
              <br />
              {settings.indipendentContributions ? (
                <Box>
                  <Typography color="primary" variant="body2">
                    {t('settings:encrypted_contributions_private_key')}
                  </Typography>
                  <Button href="/index.html?path=/settings/" target="_blank">
                    Manage tokens
                  </Button>
                </Box>
              ) : null}
            </FormLabel>
          }
          labelPlacement="end"
        />
      </FormControl>
    </>
  );
};

export default Settings;
