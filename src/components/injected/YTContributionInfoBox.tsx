import { Box, makeStyles, Typography } from '@material-ui/core';
import * as QR from 'avenger/lib/QueryResult';
import { declareQueries } from 'avenger/lib/react';
import { pipe } from 'fp-ts/lib/pipeable';
import * as React from 'react';
import { ErrorBox } from '../../components/common/ErrorBox';
import { LazyFullSizeLoader } from '../../components/common/FullSizeLoader';
import { Keypair, Settings } from '../../models/Settings';
import * as dataDonation from '../../providers/dataDonation.provider';
import { keypair, settings } from '../../state/public.queries';

const useStyles = makeStyles((props) => ({
  root: {
    display: 'flex',
    border: `2px solid ${props.palette.primary.main}`,
    borderRadius: 3,
    backgroundColor: props.palette.common.white,
    width: '100%',
    height: '100%',
  },
}));

const YTContributionInfoBoxComponent: React.FC<{
  keypair: Keypair;
  settings: Settings;
}> = ({ keypair, settings }) => {
  const classes = useStyles();
  const [state, setState] = React.useState<dataDonation.ContributionState>({
    type: 'checking',
  });

  React.useEffect(() => {
    dataDonation.boot(settings, keypair, setState);

    return () => {
      window.addEventListener('beforeunload', () => {
        dataDonation.clear(keypair);
      });
    };
  }, []);

  if (state.type === 'checking') {
    return null;
  }

  return (
    <Box className={classes.root}>
      {state.type === 'video-seen' ? (
        <Typography variant="h5">Video seen</Typography>
      ) : (
        <Typography variant="h5">Checking...</Typography>
      )}
    </Box>
  );
};

const withQueries = declareQueries({ keypair: keypair, settings: settings });
export const YTContributionInfoBox = withQueries(({ queries }) => {
  return pipe(
    queries,
    QR.fold(LazyFullSizeLoader, ErrorBox, ({ keypair, settings }) => {
      if (settings.independentContributions) {
        return (
          <YTContributionInfoBoxComponent
            keypair={keypair}
            settings={settings}
          />
        );
      }
      return null;
    })
  );
});
