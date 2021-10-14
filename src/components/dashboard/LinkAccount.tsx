import { AuthResponse } from '@backend/models/Auth';
import {
  Box,
  Button,
  ButtonGroup,
  FormControl,
  IconButton,
  Input,
  InputAdornment,
  Typography,
} from '@material-ui/core';
import InputLabel from '@material-ui/core/InputLabel';
import CopyIcon from '@material-ui/icons/FileCopyOutlined';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  copyToClipboard,
  registerCreatorChannel,
  updateAuth,
  verifyChannel,
} from '../../state/creator.commands';

interface LinkAccountProps {
  auth?: AuthResponse;
}
export const LinkAccount: React.FC<LinkAccountProps> = ({ auth }) => {
  const { t } = useTranslation();

  const [channel, setChannel] = React.useState<string>('');
  const [showPopup, setShowPopup] = React.useState(false);

  const inputRef = React.useRef<HTMLInputElement>(null);

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
      await updateAuth(undefined)();
    };

  const creatorChannelValue = channel ?? '';

  if (auth === undefined) {
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
          />
          <ButtonGroup style={{ marginTop: 10 }}>
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleChannelSubmit}
            >
              {t('actions:link_channel')}
            </Button>
          </ButtonGroup>
        </FormControl>
      </Box>
    );
  }

  if (!auth.verified) {
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
