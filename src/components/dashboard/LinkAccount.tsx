import { AuthResponse } from '@backend/models/Auth';
import {
  Box,
  Button,
  ButtonGroup,
  FormControl,
  Grid,
  Input,
  makeStyles,
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

const useStyles = makeStyles((theme) => ({
  box: {
    marginBottom: theme.spacing(2),
  },
  boxGrid: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(3),
  },
}));
interface LinkAccountProps {
  auth?: AuthResponse;
}
export const LinkAccount: React.FC<LinkAccountProps> = ({ auth }) => {
  const { t } = useTranslation();

  const [channel, setChannel] = React.useState<string>(auth?.channelId ?? '');
  const [channelCopied, setChannelCopied] = React.useState(false);
  const [showPopup, setShowPopup] = React.useState(false);

  const showVerificationCodeBox = auth?.tokenString !== undefined;

  const showVerificationBox =
    channelCopied &&
    auth?.channelId !== undefined &&
    auth.tokenString !== undefined;

  const classes = useStyles();

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
      setChannel('');
      await updateAuth(null)().then(() =>
        doUpdateCurrentView({ view: 'index' })()
      );
    };

  const creatorChannelValue = channel ?? '';

  return (
    <Grid container style={{ width: '100%' }}>
      <Grid item md={6}>
        {/** Verify your channel */}
        {showVerificationBox ? (
          <Box className={classes.box}>
            <Typography variant="subtitle2" color="secondary">
              3/3 {t('actions:verify_channel')}
            </Typography>
            <Button
              variant="contained"
              color="secondary"
              size="small"
              onClick={() =>
                verifyChannel({
                  channelId: auth.channelId,
                })()
              }
            >
              {t('actions:verify_channel')}
            </Button>
          </Box>
        ) : null}
        {showVerificationCodeBox ? (
          <Box
            className={classes.box}
            style={{
              opacity: showVerificationBox ? 0.5 : 1,
            }}
          >
            <Typography variant="subtitle2" color="secondary">
              2/3 {t('link_account:verification_code_label')}
            </Typography>
            <Typography variant="body2" color="secondary">
              {t('link_account:verification_code_hint')}
            </Typography>
            <Grid className={classes.boxGrid} container spacing={2}>
              <Grid item md={8} sm={8}>
                <FormControl style={{ display: 'flex' }}>
                  <Input
                    id="account-channelId"
                    type={'text'}
                    value={auth.tokenString}
                  />
                  <Box style={{ visibility: showPopup ? 'visible' : 'hidden' }}>
                    <Typography>Copied!</Typography>
                  </Box>
                </FormControl>
              </Grid>
              <Grid item md={4} sm={4}>
                <ButtonGroup
                  variant="contained"
                  size="small"
                  orientation="vertical"
                >
                  <Button
                    color="secondary"
                    startIcon={<CopyIcon />}
                    onClick={async () => {
                      await copyToClipboard(auth.tokenString)().then(() => {
                        setChannelCopied(true);
                        // open studio edit tab
                        setShowPopup(true);
                        setTimeout(() => {
                          setShowPopup(false);
                        }, 2000);
                      });
                    }}
                  >
                    {t('actions:copy_verification_code')}
                  </Button>
                </ButtonGroup>
              </Grid>
            </Grid>
          </Box>
        ) : null}

        <Box
          className={classes.box}
          style={{
            opacity: showVerificationCodeBox ? 0.5 : 1,
          }}
        >
          <Typography color="secondary" variant="subtitle2">
            1/3 {t('link_account:label')}
          </Typography>
          <Grid
            className={classes.boxGrid}
            container
            spacing={2}
            alignItems="flex-end"
          >
            <Grid item md={8} sm={8}>
              <FormControl style={{ display: 'flex', flexDirection: 'row' }}>
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
              </FormControl>
            </Grid>
            <Grid item md={4} sm={4}>
              <ButtonGroup>
                <Button
                  variant="contained"
                  color="secondary"
                  size="small"
                  onClick={handleChannelSubmit}
                >
                  {t('actions:link_channel')}
                </Button>
              </ButtonGroup>
            </Grid>
          </Grid>
        </Box>
        {auth?.channelId !== undefined ? (
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={handleUnlinkChannel}
          >
            {t('actions:unlink_channel')}
          </Button>
        ) : null}
      </Grid>
    </Grid>
  );
};
