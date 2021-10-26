import { Avatar, Box, Button, Typography } from '@material-ui/core';
import * as QR from 'avenger/lib/QueryResult';
import { declareQueries, WithQueries } from 'avenger/lib/react';
import { sequenceS } from 'fp-ts/lib/Apply';
import { pipe } from 'fp-ts/lib/pipeable';
import * as TE from 'fp-ts/lib/TaskEither';
import { toBrowserError } from 'providers/browser.provider';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { doUpdateCurrentView } from 'utils/location.utils';
import { updateAuth, updateProfile } from '../../state/creator.commands';
import { profile } from '../../state/creator.queries';
import { ErrorBox } from '../common/ErrorBox';
import { LazyFullSizeLoader } from '../common/FullSizeLoader';
import { LinkAccountButton } from '../common/LinkAccountButton';

interface LoggedUserProfileBoxProps {
  onLogout: () => void;
}

export const LoggedUserProfileBox: React.FC<LoggedUserProfileBoxProps> = ({
  onLogout,
}) => {
  const { t } = useTranslation();

  return (
    <WithQueries
      queries={{
        profile: profile,
      }}
      render={QR.fold(LazyFullSizeLoader, ErrorBox, ({ profile }) => {
        return (
          <Box display="flex" alignItems="center">
            <Avatar src={profile.avatar} style={{ marginRight: 10 }} />
            <Box
              display="flex"
              flexDirection="column"
              style={{ marginRight: 20 }}
            >
              <Typography variant="subtitle1">{profile.username}</Typography>
              <Typography variant="caption">{profile.channelId}</Typography>
              <Button
                color="secondary"
                variant="outlined"
                size="small"
                onClick={() => onLogout()}
              >
                {t('actions:unlink_channel')}
              </Button>
            </Box>
          </Box>
        );
      })}
    />
  );
};

const withQueries = declareQueries({ profile });

export const UserProfileBox = withQueries(({ queries }): React.ReactElement => {
  const handleChannelDelete = React.useCallback(async (): Promise<void> => {
    void pipe(
      sequenceS(TE.ApplicativePar)({
        auth: updateAuth(undefined),
        profile: updateProfile(undefined),
      }),
      TE.chainFirst(() =>
        pipe(doUpdateCurrentView({ view: 'index' }), TE.mapLeft(toBrowserError))
      )
    )();
  }, []);

  return pipe(
    queries,
    QR.fold(LazyFullSizeLoader, ErrorBox, ({ profile }) => {
      if (profile === undefined) {
        return (
          <Box>
            <LinkAccountButton />
          </Box>
        );
      }

      return <LoggedUserProfileBox onLogout={() => handleChannelDelete()} />;
    })
  );
});
