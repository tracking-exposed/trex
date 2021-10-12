import { Avatar, Box, Button, Typography } from '@material-ui/core';
import * as QR from 'avenger/lib/QueryResult';
import { declareQueries, WithQueries } from 'avenger/lib/react';
import { pipe } from 'fp-ts/lib/pipeable';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Queries } from '../../API/APIProvider';
import { updateSettings, verifyChannel } from '../../API/commands';
import { accountSettings } from '../../API/queries';
import { AccountSettings } from '../../models/AccountSettings';
import { ErrorBox } from '../common/ErrorBox';
import { LazyFullSizeLoader } from '../common/FullSizeLoader';
import { LinkAccount } from './LinkAccount';

interface LoggedUserProfileBoxProps {
  channelId: string;
  onUnlinkChannel: () => void;
}

export const LoggedUserProfileBox: React.FC<LoggedUserProfileBoxProps> = ({
  channelId,
  onUnlinkChannel,
}) => {
  const { t } = useTranslation();

  return (
    <WithQueries
      queries={{
        creator: Queries.creator.GetCreator,
      }}
      params={{
        creator: { Params: { channelId } },
      }}
      render={QR.fold(LazyFullSizeLoader, ErrorBox, ({ creator }) => {
        return !creator.verified ? (
          <Box>
            <Button
              onClick={() =>
                verifyChannel(
                  {
                    channelId,
                  },
                  { creator: { Params: { channelId } } }
                )()
              }
            >
              {t('actions:verify_channel')}
            </Button>
          </Box>
        ) : (
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
                onClick={() => onUnlinkChannel()}
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

const withQueries = declareQueries({ accountSettings });

export const UserProfileBox = withQueries(({ queries }): React.ReactElement => {
  const handleChannelDelete = React.useCallback(
    async (settings: AccountSettings): Promise<void> => {
      await updateSettings({
        ...settings,
        channelCreatorId: null,
      })();
    },
    []
  );

  return pipe(
    queries,
    QR.fold(LazyFullSizeLoader, ErrorBox, ({ accountSettings }) => {
      return accountSettings.channelCreatorId === null ? (
        <LinkAccount />
      ) : (
        <LoggedUserProfileBox
          channelId={accountSettings.channelCreatorId}
          onUnlinkChannel={() => handleChannelDelete(accountSettings)}
        />
      );
    })
  );
});
