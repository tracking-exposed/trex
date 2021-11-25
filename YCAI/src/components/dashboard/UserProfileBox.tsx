import React from 'react';
import { ContentCreator } from '@shared/models/ContentCreator';
import { Box, Typography, makeStyles } from '@material-ui/core';
import Avatar from '../external/Avatar';
import * as QR from 'avenger/lib/QueryResult';
import { declareQueries } from 'avenger/lib/react';
import { sequenceS } from 'fp-ts/lib/Apply';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import { toBrowserError } from 'providers/browser.provider';
import { doUpdateCurrentView } from 'utils/location.utils';
import { updateAuth, updateProfile } from '../../state/creator.commands';
import { localProfile } from '../../state/creator.queries';
import { ErrorBox } from '../common/ErrorBox';
import { LazyFullSizeLoader } from '../common/FullSizeLoader';
import UnlinkProfileButton from '../common/UnlinkProfileButton';

interface LoggedUserProfileBoxProps {
  onLogout: () => void;
  profile: ContentCreator;
}

const useStyles = makeStyles((theme) => ({
  username: {
    marginBottom: theme.spacing(0),
  },
  caption: {
    marginBottom: theme.spacing(1),
    marginTop: theme.spacing(0.7),
  },
}));

export const LoggedUserProfileBox: React.FC<LoggedUserProfileBoxProps> = ({
  onLogout,
  profile,
}) => {
  const classes = useStyles();

  return (
    <Box display="flex" alignItems="flex-start" flexDirection="column">
      <Box display="flex" alignItems="center">
      <Avatar src={profile.avatar} style={{ marginRight: 10 }} />
      <Box display="flex" flexDirection="column" style={{ marginRight: 20 }}>
        <Typography variant="body1" className={classes.username}>
          {profile.username}
        </Typography>
        <Typography variant="caption" className={classes.caption}>
          {profile.channelId}
        </Typography>
      </Box>
      </Box>
      <UnlinkProfileButton
        style={{ marginLeft: 50 }}
        variant="contained"
        size="small"
        onLogout={onLogout}
      />
    </Box>
  );
};

const withQueries = declareQueries({ profile: localProfile });

export const UserProfileBox = withQueries(
  ({ queries }): React.ReactElement | null => {
    const handleChannelDelete = React.useCallback(async (): Promise<void> => {
      void pipe(
        sequenceS(TE.ApplicativePar)({
          auth: updateAuth(null),
          profile: updateProfile(null),
        }),
        TE.chainFirst(() =>
          pipe(
            doUpdateCurrentView({ view: 'index' }),
            TE.mapLeft(toBrowserError)
          )
        )
      )();
    }, []);

    return pipe(
      queries,
      QR.fold(LazyFullSizeLoader, ErrorBox, ({ profile }) => {
        if (profile === null) {
          return null;
        }

        return (
          <LoggedUserProfileBox
            profile={profile}
            onLogout={() => handleChannelDelete()}
          />
        );
      })
    );
  }
);
