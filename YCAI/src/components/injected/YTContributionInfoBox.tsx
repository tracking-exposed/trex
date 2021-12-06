import { Box, Typography } from '@material-ui/core';
import * as QR from 'avenger/lib/QueryResult';
import { WithQueries } from 'avenger/lib/react';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { ErrorBox } from '../../components/common/ErrorBox';
import { LazyFullSizeLoader } from '../../components/common/FullSizeLoader';
import { config } from '../../config';
import { Keypair, Settings } from '../../models/Settings';
import * as dataDonation from '../../providers/dataDonation.provider';
import { keypair } from '../../state/popup.queries';
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
  node: HTMLDivElement;
  keypair: Keypair;
  settings: Settings;
}> = ({ keypair, settings, node }) => {
  const classes = useStyles();
  const [state, setState] = React.useState<dataDonation.ContributionState>({
    type: 'idle',
  });

  React.useEffect(() => {
    dataDonation.boot(settings, keypair, setState);
    return () => {
      dataDonation.clear(keypair);
    };
  }, [settings]);

  // don't render anything in production
  if (config.NODE_ENV === 'production') {
    return ReactDOM.createPortal(null, node);
  }

  return ReactDOM.createPortal(
    <Box className={classes.root}>
      <Typography
        variant="subtitle1"
        style={{ marginBottom: 0, marginRight: 10, fontWeight: 800 }}
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
    </Box>,
    node
  );
};

export const YTContributionInfoBox: React.FC<{
  node: HTMLDivElement;
  settings: Settings;
}> = ({ node, settings }) => {
  return (
    <WithQueries
      queries={{ keypair }}
      render={QR.fold(LazyFullSizeLoader, ErrorBox, ({ keypair }) => {
        if (settings === null || !settings.independentContributions.enable) {
          return null;
        }
        return (
          <YTContributionInfoBoxComponent
            node={node}
            keypair={keypair}
            settings={settings}
          />
        );
      })}
    />
  );
};
