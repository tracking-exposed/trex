import {
  Box,
  Button,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  makeStyles,
  Switch,
  Typography,
  useTheme,
} from '@material-ui/core';
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
  const theme = useTheme();

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
              aria-labelledby="switch-independentContributions"
              color="primary"
              checked={settings.independentContributions !== null}
              onChange={(e, independentContributions) => {
                if (independentContributions) {
                  void generateKeypair({})();
                }

                void updateSettings({
                  ...settings,
                  independentContributions: independentContributions
                    ? {
                        showUI: false,
                      }
                    : null,
                })();
              }}
            />
          }
          label={
            <FormLabel>
              <Typography variant="h6">
                {t('settings:contributeToIndependentStatsLabel')}
              </Typography>
              <Typography variant="body2" display="block">
                {t('settings:contributeToIndependentStatsHint')}
              </Typography>
              <br />
            </FormLabel>
          }
          labelPlacement="end"
        />
        {settings.independentContributions !== null ? (
          <FormControl style={{ paddingLeft: 80 }}>
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  aria-labelledby="switch-independentContributions-showUI"
                  color="primary"
                  checked={settings.independentContributions.showUI}
                  onChange={(e, showUI) => {
                    void updateSettings({
                      ...settings,
                      independentContributions: {
                        showUI,
                      },
                    })();
                  }}
                />
              }
              label={
                <FormLabel>
                  <Typography
                    variant="subtitle1"
                    style={{ marginBottom: theme.spacing(2) }}
                  >
                    {t('settings:contributeToIndependentStatsShowUILabel')}
                  </Typography>
                  <Typography variant="body2" display="block">
                    {t('settings:contributeToIndependentStatsShowUIHint')}
                  </Typography>
                  <br />
                </FormLabel>
              }
            />
            <Box>
              <Button
                color="primary"
                variant="outlined"
                size="small"
                href="/index.html?path=/settings/"
                target="_blank"
              >
                {t('actions:manage_tokens')}
              </Button>
            </Box>
          </FormControl>
        ) : null}
      </FormControl>
    </>
  );
};

export default Settings;
