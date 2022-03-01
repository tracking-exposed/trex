import { Box, Typography } from '@material-ui/core';
import { ErrorBox } from '@shared/components/Error/ErrorBox';
import { Keypair } from '@shared/models/extension/Keypair';
import { ContributionState } from '@shared/providers/dataDonation.provider';
import * as QR from 'avenger/lib/QueryResult';
import { WithQueries } from 'avenger/lib/react';
import React from 'react';
import { LazyFullSizeLoader } from '../../components/common/FullSizeLoader';
import { Settings } from '../../models/Settings';
import { dataDonation } from '../../providers/dataDonation.provider';
import { keypair } from '../../state/popup/popup.queries';
import { makeStyles } from '../../theme';

const useStyles = makeStyles((props) => ({
  root: {
    display: 'flex',
    border: `2px solid ${props.palette.primary.main}`,
    borderRadius: 3,
    padding: 5,
    backgroundColor: props.palette.common.white,
    width: '100%',
    height: '100%',
    alignContent: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    margin: 0,
  },
}));

const YTContributionInfoBoxComponent: React.FC<{
  keypair: Keypair;
  settings: Settings;
}> = ({ keypair, settings }) => {
  const classes = useStyles();
  const [state, setState] = React.useState<ContributionState>({
    type: 'idle',
  });

  React.useEffect(() => {
    dataDonation.boot(keypair, setState);
    return () => {
      dataDonation.clear(keypair);
    };
  }, [settings]);

  if (!settings.independentContributions.showUI) {
    return null;
  }

  return (
    <Box className={classes.root}>
      <Typography
        variant="subtitle1"
        style={{ fontWeight: 800 }}
        display="inline"
        color="primary"
      >
        This is only visible in DEVELOPMENT
      </Typography>
      <Typography className={classes.label} variant="body1" display="inline">
        {state.type === 'video-seen'
          ? 'Video seen...'
          : state.type === 'video-sent'
          ? 'Video sent!'
          : state.type === 'adv-seen'
          ? 'ADV seen...'
          : 'ADV sent...'}
      </Typography>
    </Box>
  );
};

export const YTContributionInfoBox: React.FC<{
  settings: Settings;
}> = ({ settings }) => {
  return (
    <div
      style={{
        position: 'fixed',
        width: 200,
        height: 30,
        right: 20,
        bottom: 20,
        padding: 4,
        zIndex: 9000,
        borderRadius: 10,
      }}
    >
      <WithQueries
        queries={{ keypair }}
        render={QR.fold(LazyFullSizeLoader, ErrorBox, ({ keypair }) => {
          if (settings === null || !settings.independentContributions.enable) {
            return null;
          }
          return (
            <YTContributionInfoBoxComponent
              keypair={keypair}
              settings={settings}
            />
          );
        })}
      />
    </div>
  );
};
