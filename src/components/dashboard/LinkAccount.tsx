import { AuthResponse } from '@backend/models/Auth';
import {
  Box,
  Button,
  ButtonGroup,
  FormControl,
  Grid,
  IconButton,
  Input,
  InputAdornment,
  Typography,
} from '@material-ui/core';
import InputLabel from '@material-ui/core/InputLabel';
import CopyIcon from '@material-ui/icons/FileCopyOutlined';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { doUpdateCurrentView } from 'utils/location.utils';
import {
  copyToClipboard,
  registerCreatorChannel,
  updateAuth,
  verifyChannel,
} from '../../state/creator.commands';

const youtubeChannelUrlRegex = /^https:\/\/www.youtube.com\/channel\/([^/]+)$/;

interface LinkAccountProps {
  auth: AuthResponse;
}
export const LinkAccount: React.FC<LinkAccountProps> = ({ auth }) => {
  const { t } = useTranslation();

  const [channel, setChannel] = React.useState<string>('');
  const [showPopup, setShowPopup] = React.useState(false);

  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleChannelChange: React.ChangeEventHandler<
    HTMLInputElement | HTMLTextAreaElement
  > = (e) => {
    const youtubeChannelUrlMatch = e.target.value.match(youtubeChannelUrlRegex);
    if (youtubeChannelUrlMatch !== null) {
      setChannel(youtubeChannelUrlMatch[1]);
      return;
    }

    setChannel(e.target.value);
  };

  const onSubmit: React.KeyboardEventHandler<HTMLInputElement> = async (
    e
  ): Promise<void> => {
    // this handle the pressing of "Enter" key
    if (e.keyCode === 13) {
      await registerCreatorChannel(e.currentTarget.value, {
        ccRelatedUsers: { params: { skip: 0, amount: 5 } },
      })();
    }
  };

  const handleChannelSubmit: React.MouseEventHandler<HTMLButtonElement> =
    async () => {
      if (inputRef.current?.firstChild !== null) {
        const channelId = (inputRef.current?.firstChild as any).value;
        await registerCreatorChannel(channelId, {
          ccRelatedUsers: { params: { skip: 0, amount: 5 } },
        })();
      }
    };
  const handleUnlinkChannel: React.MouseEventHandler<HTMLButtonElement> =
    async () => {
      await updateAuth(undefined)().then(() =>
        doUpdateCurrentView({ view: 'index' })()
      );
    };

  const creatorChannelValue = channel ?? '';

  if (auth === undefined) {
    return (
      <Grid container style={{ width: '100%' }}>
        <Grid item md={3} />
        <Grid item md={6}>
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
                onChange={handleChannelChange}
                onKeyDown={onSubmit}
              />
              <ButtonGroup style={{ marginTop: 10 }}>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={handleChannelSubmit}
                >
                  {t('actions:link_channel')}{' '}
                  {creatorChannelValue !== '' ? `(${creatorChannelValue})` : ''}
                </Button>
              </ButtonGroup>
            </FormControl>
          </Box>
        </Grid>
      </Grid>
    );
  }

  if (auth.verified === false) {
    return (
      <Box>
        <Typography variant="body2">
          {t('actions:verify_channel_hint')}
        </Typography>
        <FormControl style={{ margin: 10, display: 'flex' }}>
          <InputLabel htmlFor="link-account-password">Password</InputLabel>

          <Input
            id="link-account-password"
            type={'text'}
            value={auth.tokenString}
            endAdornment={
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={async () => {
                    await copyToClipboard(auth.tokenString)().then(() => {
                      // open studio edit tab
                      window.open(
                        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                        `https://studio.youtube.com/channel/${auth.channelId}/editing/details`
                      );
                      setShowPopup(true);
                      setTimeout(() => {
                        setShowPopup(false);
                      }, 2000);
                    });
                  }}
                  edge="end"
                >
                  {<CopyIcon />}
                </IconButton>
              </InputAdornment>
            }
          />
          <Box style={{ visibility: showPopup ? 'visible' : 'hidden' }}>
            <Typography>Copied!</Typography>
          </Box>
        </FormControl>

        <ButtonGroup>
          <Button size="small" onClick={handleUnlinkChannel}>
            {t('actions:unlink_channel')}
          </Button>
          <Button
            color="secondary"
            variant="outlined"
            onClick={() =>
              verifyChannel({
                channelId: auth.channelId,
              })()
            }
          >
            {t('actions:verify_channel')}
          </Button>
        </ButtonGroup>
      </Box>
    );
  }

  return (
    <Box>
      <Button
        color="secondary"
        variant="outlined"
        size="small"
        onClick={handleUnlinkChannel}
      >
        {t('actions:unlink_channel')}
      </Button>
    </Box>
  );
};
