import React, { useState, useEffect } from 'react';
import { WithQueries } from 'avenger/lib/react';
import { fold } from 'avenger/lib/QueryResult';
import { useTranslation } from 'react-i18next';
import { Button, Link, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';

import { settings } from '../../state/popup/popup.queries';
import { donationOptInNudgeStatus } from '../../state/injected/injected.queries';
import { setDonationOptInNudgeStatus } from '../../state/injected/injected.commands';
import { updateSettings } from '../../state/popup/popup.commands';
import { YCAITheme } from '../../theme';
import { DATA_DONATION_LEARN_MORE_URL } from '../../constants';

const useStyles = makeStyles<YCAITheme>((theme) => ({
  box: {
    border: `1px solid ${theme.palette.divider}`,
    padding: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  text: {
    fontSize: '1.4rem',
    marginBottom: theme.spacing(1),
  },
}));

const DonationOptInNudger: React.FC = () => (
  <WithQueries
    queries={{ settings, donationOptInNudgeStatus }}
    render={fold(
      () => null,
      () => null,
      ({ settings, donationOptInNudgeStatus }) => {
        const { t } = useTranslation();
        const classes = useStyles();

        const [showNudge, setShowNudge] = useState(false);

        useEffect(() => {
          const { showNudgeTimes } = donationOptInNudgeStatus;

          if (showNudgeTimes.length === 0) {
            return;
          }

          const [nextNudgeTime] = showNudgeTimes;

          const now = Date.now();

          if (now >= nextNudgeTime) {
            setShowNudge(true);
            return;
          }

          const timeout = setTimeout(() => {
            setShowNudge(true);
          }, nextNudgeTime - now);

          return () => clearTimeout(timeout);
        }, []);

        const handleNotNowClicked = (): void => {
          // clicking on not now should hide the nudge until the next time stored
          // in the local storage
          setShowNudge(false);
          const {
            showNudgeTimes: [, ...remaining],
          } = donationOptInNudgeStatus;
          void setDonationOptInNudgeStatus({ showNudgeTimes: remaining })();
        };

        const handleAgreeClicked = (): void => {
          void updateSettings({
            ...settings,
            independentContributions: {
              ...settings.independentContributions,
              enable: true,
            },
          })();
          setShowNudge(false);
        };

        if (!showNudge || settings.independentContributions.enable) {
          return null;
        }

        return (
          <div className={classes.box}>
            <Typography className={classes.text}>
              {t('settings:nudge_donation_opt_in')}
              &nbsp;
              <Link
                href={DATA_DONATION_LEARN_MORE_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('settings:nudge_learn_more')}
              </Link>
            </Typography>

            <Button color="secondary" onClick={handleNotNowClicked}>
              {t('settings:nudge_not_now')}
            </Button>
            <Button color="primary" onClick={handleAgreeClicked}>
              {t('settings:nudge_agree')}
            </Button>
          </div>
        );
      }
    )}
  />
);

export default DonationOptInNudger;
