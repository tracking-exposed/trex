import { Avatar, Box, Button, Typography } from '@material-ui/core';
import * as QR from 'avenger/lib/QueryResult';
import { declareQueries, WithQueries } from 'avenger/lib/react';
import { pipe } from 'fp-ts/lib/pipeable';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { updateAuth } from '../../state/creator.commands';
import { profile, auth } from '../../state/creator.queries';
import { ErrorBox } from '../common/ErrorBox';
import { LazyFullSizeLoader } from '../common/FullSizeLoader';
import { LinkAccountButton } from 'components/common/LinkAccountButton';

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
        profile,
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
              <Typography variant="subtitle1">{profile.channelId}</Typography>
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

const withQueries = declareQueries({ auth });

export const UserProfileBox = withQueries(({ queries }): React.ReactElement => {
  const handleChannelDelete = React.useCallback(async (): Promise<void> => {
    await updateAuth(undefined)();
  }, []);

  return pipe(
    queries,
    QR.fold(LazyFullSizeLoader, ErrorBox, ({ auth }) => {
      if (auth === undefined || !auth.verified) {
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
