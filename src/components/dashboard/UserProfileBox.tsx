import { Avatar, Box, Button, Typography } from '@material-ui/core';
import * as QR from 'avenger/lib/QueryResult';
import { useQueries } from 'avenger/lib/react';
import { ErrorBox } from 'components/common/ErrorBox';
import { LazyFullSizeLoader } from 'components/common/FullSizeLoader';
import { pipe } from 'fp-ts/lib/pipeable';
import { AccountSettings } from 'models/AccountSettings';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { doUpdateCurrentView } from 'utils/location.utils';
import { updateSettings } from '../../API/commands';
import { accountSettings } from '../../API/queries';

export const UserProfileBox: React.FC = (props) => {
  const queries = useQueries({ accountSettings });
  const { t } = useTranslation();

  const handleChannelDelete = async (
    settings: AccountSettings
  ): Promise<void> => {
    await updateSettings({
      ...settings,
      channelCreatorId: null,
    })();
  };

  return pipe(
    queries,
    QR.fold(LazyFullSizeLoader, ErrorBox, ({ accountSettings }) => {
      if (accountSettings.channelCreatorId == null) {
        return (
          <Box>
            <Typography>{t('link_account:title')}</Typography>
            <Button
              color="secondary"
              variant="contained"
              onClick={() => {
                void doUpdateCurrentView({ view: 'linkAccount' })();
              }}
            >
              {t('actions:link_channel')}
            </Button>
          </Box>
        );
      }
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
            <Typography variant="subtitle1">
              {accountSettings.channelCreatorId}
            </Typography>
            <Typography variant="caption">
              {accountSettings.channelCreatorId}
            </Typography>
            <Button
              color="secondary"
              variant="outlined"
              size="small"
              onClick={() => handleChannelDelete(accountSettings)}
            >
              {t('actions:unlink_channel')}
            </Button>
          </Box>
        </Box>
      );
    })
  );
};
