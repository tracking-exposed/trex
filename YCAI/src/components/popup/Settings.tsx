import React from 'react';
import {
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  Link,
  makeStyles,
  Switch,
  Typography,
} from '@material-ui/core';
import { Folder as FolderIcon } from '@material-ui/icons';
import { useTranslation } from 'react-i18next';
import * as models from '../../models';
import { generateKeypair, updateSettings } from '../../state/popup.commands';
import { DATA_DONATION_LEARN_MORE_URL } from '../../constants';

const useStyles = makeStyles((theme) => ({
  divider: {
    marginTop: theme.spacing(4),
    marginBottom: theme.spacing(4),
  },
  smallTitle: {
    marginTop: 30,
    paddingBottom: 12,
  },
  controlLabel: {
    alignItems: 'flex-start',
    marginLeft: 0,
    marginRight: 0,
    marginBottom: theme.spacing(2),
  },
  marginRight: {
    marginRight: 15,
  },
  learnMore: {
    alignItems: 'center',
    display: 'flex',
    lineHeight: 1,
    marginTop: theme.spacing(1),
    marginLeft: -6,
    '& svg': {
      height: 16,
    }
  }
}));

interface SettingsProps {
  settings: models.Settings.Settings;
}

const Settings: React.FC<SettingsProps> = ({ settings }) => {
  const { t } = useTranslation();
  const classes = useStyles();

  return (
    <>
      <FormControlLabel
        className={classes.controlLabel}
        control={
          <Switch
            className={classes.marginRight}
            aria-labelledby="switch-recommendations"
            color="primary"
            checked={settings.enhanceYouTubeExperience}
            onChange={(e, checked) =>
              updateSettings({ ...settings, enhanceYouTubeExperience: checked })()
            }
          />
        }
        label={
          <FormLabel>
            <Typography variant="h5">
              {t('settings:contentCreatorRecommendationLabel')}
            </Typography>
            <Typography display="block">
              {t('settings:contentCreatorRecommendationHint')}
            </Typography>
            <br />
            <Divider light />
            <br />
            <br />
          </FormLabel>
        }
        labelPlacement="end"
      />

      <FormControl component="fieldset">
        <FormControlLabel
          className={classes.controlLabel}
          control={
            <Switch
              className={classes.marginRight}
              aria-labelledby="switch-independentContributions"
              color="primary"
              checked={settings.independentContributions.enable}
              onChange={(e, enable) => {
                if (enable) {
                  void generateKeypair({})();
                }

                void updateSettings({
                  ...settings,
                  independentContributions: {
                    ...settings.independentContributions,
                    enable,
                  },
                })();
              }}
            />
          }
          label={
            <FormLabel>
              <Typography variant="h5">
                {t('settings:contributeToIndependentStatsLabel')}
              </Typography>
              <Typography display="block">
                {t('settings:contributeToIndependentStatsHint')}
              </Typography>
              <Link
                className={classes.learnMore}
                href={DATA_DONATION_LEARN_MORE_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FolderIcon /> {t('settings:data_donation_learn_more')}
              </Link>
              <br />
              <Divider light />
            </FormLabel>
          }
          labelPlacement="end"
        />
      </FormControl>
    </>
  );
};

export default Settings;
