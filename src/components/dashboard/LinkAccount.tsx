import {
  Box,
  Button,
  ButtonGroup,
  FormControl,
  Input,
  InputAdornment,
  Typography,
} from '@material-ui/core';
import InputLabel from '@material-ui/core/InputLabel';
import * as QR from 'avenger/lib/QueryResult';
import { declareQueries } from 'avenger/lib/react';
import { pipe } from 'fp-ts/lib/function';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { registerCreatorChannel, updateSettings } from '../../API/commands';
import * as queries from '../../API/queries';
import { ErrorBox } from '../../components/common/ErrorBox';
import { LazyFullSizeLoader } from '../common/FullSizeLoader';
import DeleteIcon from '@material-ui/icons/DeleteOutline';

const withQueries = declareQueries({
  accountSettings: queries.accountSettings,
});

export const LinkAccount = withQueries(({ queries }) => {
  return pipe(
    queries,
    QR.fold(LazyFullSizeLoader, ErrorBox, ({ accountSettings }) => {
      const { t } = useTranslation();

      const [channel, setChannel] = React.useState<string | null>(
        accountSettings.channelCreatorId
      );

      const inputRef = React.useRef<HTMLInputElement>(null);

      const onSubmit: React.KeyboardEventHandler<HTMLInputElement> = async (
        e
      ): Promise<void> => {
        // this handle the pressing of "Enter" key
        if (e.keyCode === 13) {
          await registerCreatorChannel(e.currentTarget.value, {
            ccRelatedUsers: { channelId: e.currentTarget.value, amount: 5 },
          })();
        }
      };

      const handleChannelSubmit: React.MouseEventHandler<HTMLButtonElement> =
        async () => {
          if (inputRef.current?.firstChild !== null) {
            const channelId = (inputRef.current?.firstChild as any).value;
            await registerCreatorChannel(channelId, {
              ccRelatedUsers: { channelId, amount: 5 },
            })();
          }
        };

      const handleChannelDelete = async (): Promise<void> => {
        setChannel(null);
        await updateSettings({
          ...accountSettings,
          channelCreatorId: null,
        })();
      };

      const creatorChannelValue = channel ?? '';

      return (
        <Box display="flex" flexDirection="column">
          <Typography color="secondary" variant="subtitle1">
            {t('link_account:label')}
          </Typography>
          <FormControl>
            <InputLabel htmlFor="creator-channel">
              {t('account:channel')}
            </InputLabel>
            <Input
              id="creator-channel"
              ref={inputRef}
              fullWidth={true}
              value={creatorChannelValue}
              onChange={(e) => setChannel(e.target.value)}
              onKeyDown={onSubmit}
              endAdornment={
                accountSettings.channelCreatorId !== null ? (
                  <InputAdornment position="end">
                    <DeleteIcon onClick={() => handleChannelDelete()} />
                  </InputAdornment>
                ) : null
              }
            />
            <ButtonGroup style={{ marginTop: 10 }}>
              <Button
                variant="outlined"
                color="secondary"
                disabled={
                  creatorChannelValue === accountSettings.channelCreatorId
                }
                onClick={handleChannelSubmit}
              >
                {t('actions:link_channel')}
              </Button>
            </ButtonGroup>
          </FormControl>
        </Box>
      );
    })
  );
});
