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

interface LoggedInUserProfileBoxProps {
  onLogout: () => void;
  profile: ContentCreator;
}

const useStyles = makeStyles((theme) => ({
  avatar: {
    marginRight: theme.spacing(1),
  },
  username: {
    marginBottom: theme.spacing(1),
    lineHeight: 1,
  },
  channel: {
    display: 'block',
    marginBottom: theme.spacing(1),
    wordBreak: 'break-all',
  },
  unlink: {
    padding: 0,
    lineHeight: 1,
    marginBottom: 0,
  },
}));

export const LoggedInUserProfileBox: React.FC<LoggedInUserProfileBoxProps> = ({
  onLogout,
  profile,
}) => {
  const classes = useStyles();

  return (
    <Box display="flex" alignItems="flex-start">
      <Avatar src={profile.avatar} className={classes.avatar} />
      <Box>
        <Typography className={classes.username}>
          {profile.username}
        </Typography>
        <Typography variant="caption" className={classes.channel}>
          Channel ID:<br />{profile.channelId}
        </Typography>
        <UnlinkProfileButton
          className={classes.unlink}
          variant="text"
          size="small"
          onLogout={onLogout}
        />
      </Box>
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
          <LoggedInUserProfileBox
            profile={profile}
            onLogout={() => handleChannelDelete()}
          />
        );
      })
    );
  }
);
