import { Avatar, Box, Button, Typography } from '@material-ui/core';
import * as QR from 'avenger/lib/QueryResult';
import { declareQueries, WithQueries } from 'avenger/lib/react';
import { pipe } from 'fp-ts/lib/pipeable';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { updateAuth } from '../../API/commands';
import { getAuth, getContentCreator } from '../../API/queries';
import { ErrorBox } from '../common/ErrorBox';
import { LazyFullSizeLoader } from '../common/FullSizeLoader';
import { LinkAccount } from './LinkAccount';

interface LoggedUserProfileBoxProps {
  channelId: string;
  onLogout: () => void;
}

export const LoggedUserProfileBox: React.FC<LoggedUserProfileBoxProps> = ({
  channelId,
  onLogout,
}) => {
  const { t } = useTranslation();

  return (
    <WithQueries
      queries={{
        creator: getContentCreator,
      }}
      render={QR.fold(LazyFullSizeLoader, ErrorBox, ({ creator }) => {
        return (
          <Box display="flex" alignItems="center">
            <Avatar
              src={`http://placekitten.com/400/200`}
              style={{ marginRight: 10 }}
            />
            <Box
              display="flex"
              flexDirection="column"
              style={{ marginRight: 20 }}
            >
              <Typography variant="subtitle1">{creator.channelId}</Typography>
              <Typography variant="caption">{creator.channelId}</Typography>
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

const withQueries = declareQueries({ auth: getAuth });

export const UserProfileBox = withQueries(({ queries }): React.ReactElement => {
  const handleChannelDelete = React.useCallback(async (): Promise<void> => {
    await updateAuth(undefined)();
  }, []);

  return pipe(
    queries,
    QR.fold(LazyFullSizeLoader, ErrorBox, ({ auth }) => {
      if (auth === undefined || !auth.verified) {
        return <LinkAccount auth={auth} />;
      }

      return (
        <LoggedUserProfileBox
          channelId={auth.channelId}
          onLogout={() => handleChannelDelete()}
        />
      );
    })
  );
});
