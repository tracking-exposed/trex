import { AuthResponse } from '@shared/models/Auth';
import {
  Box,
  Button,
  Chip,
  FormControl,
  Grid,
  Input,
  InputLabel,
  Link,
  Typography,
} from '@material-ui/core';
import CopyIcon from '@material-ui/icons/FileCopyOutlined';
import { isLeft } from 'fp-ts/lib/Either';
import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import {
  copyToClipboard,
  registerCreatorChannel,
  updateAuth,
  verifyChannel,
} from '../../state/creator.commands';
import { makeStyles } from '../../theme';

const youtubeChannelUrlRegex = /\/channel\/([^/]+)(?:$|\/)/;

export const SET_CHANNEL_STEP_ID = 'link-account-set-channel';
export const COPY_CHANNEL_STEP_ID = 'link-account-copy-channel';
export const VERIFY_CHANNEL_STEP_ID = 'link-account-verify-channel';

const useStyles = makeStyles((theme) => ({
  box: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(2),
  },
  boxGrid: {
    marginTop: theme.spacing(10),
    marginBottom: theme.spacing(3),
  },
  tokenDisplay: {
    backgroundColor: theme.palette.grey[200],
    display: 'inline-block',
    padding: theme.spacing(2),
    marginRight: theme.spacing(2),
  },
  stepAction: {
    display: 'flex',
    alignItems: 'flex-start',
    marginTop: theme.spacing(5),
    '& button': {
      marginRight: theme.spacing(4),
    }
  },
  linkButton: {
    '&:hover': {
      cursor: 'pointer',
    },
  },
  list: {
    '& li': {
      marginBottom: theme.spacing(1),
    }
  },
  errorBox: {
    display: 'inline-block',
  }
}));
interface LinkAccountProps {
  auth: AuthResponse | null;
}
export const LinkAccount: React.FC<LinkAccountProps> = ({ auth }) => {
  const { t } = useTranslation();

  const [channel, setChannel] = React.useState<string>(auth?.channelId ?? '');
  const [showCopiedFeedback, setShowCopiedFeedback] = React.useState(false);
  const [submitChannelFailed, setSubmitChannelFailed] = React.useState(false);
  const [verificationFailed, setVerificationFailed] = React.useState(false);
  const [verifying, setVerifying] = React.useState(false);

  const channelIDPasted = auth?.tokenString !== undefined;

  const classes = useStyles();

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
      const resp = await registerCreatorChannel(channel, {
        ccRelatedUsers: { params: { skip: 0, amount: 5 } },
      })();
      setSubmitChannelFailed(isLeft(resp));
    };

  const handleVerifyChannelClicked = (): void => {
    setVerifying(true);
    setVerificationFailed(false);

    if (auth?.channelId !== undefined) {
      verifyChannel({
        channelId: auth.channelId,
      })()
        .then(
          (res) => {
            if (isLeft(res)) {
              setVerificationFailed(true);
            }
          },
          () => {
            setVerificationFailed(true);
          }
        )
        .finally(() => {
          setVerifying(false);
        });
    }
  };

  const handleGoBackToStepOneClicked = (): void => {
    setVerificationFailed(false);
    setSubmitChannelFailed(false);
    setChannel('');

    void updateAuth(null)();
  };

  return !channelIDPasted ? (
    <Box className={classes.box}>
      <Typography color="primary" variant="h5">
        1/2 {t('link_account:paste_channel_url')}
      </Typography>
      <Grid
        className={classes.boxGrid}
        container
        spacing={2}
        alignItems="flex-end"
      >
        <Grid item xs={12} sm={6}>
          <FormControl style={{ display: 'flex', flexDirection: 'row' }}>
            <InputLabel htmlFor="creator-channel">
              {t('account:channel')}
            </InputLabel>
            <Input
              id="creator-channel"
              fullWidth={true}
              value={channel}
              onChange={handleChannelChange}
              onKeyDown={onSubmit}
            />
          </FormControl>
        </Grid>
        <Grid item xs={12} className={classes.stepAction}>
          <Button
            disabled={channel.length < 5}
            variant="contained"
            size="large"
            color="primary"
            onClick={handleChannelSubmit}
          >
            {t('actions:next')}
          </Button>
          {submitChannelFailed && (
            <Box className={classes.errorBox}>
              <Typography>
                {t('link_account:channel_not_found')}
              </Typography>
            </Box>
          )}
        </Grid>
      </Grid>
    </Box>
  ) : (
    <Box className={classes.box}>
      <Typography variant="h5" color="primary">
        2/2 {t('link_account:copy_verification_key')}
      </Typography>
      <Grid container className={classes.boxGrid} spacing={2}>
        <Grid item xs={12}>
          <Typography className={classes.tokenDisplay} id="account-channelId">
            {auth.tokenString}
          </Typography>
          {showCopiedFeedback ? (
            <Chip color="secondary" label={t('actions:copied')} />
          ) : (
            <Button
              color="primary"
              variant="text"
              startIcon={<CopyIcon />}
              onClick={async () => {
                await copyToClipboard(auth.tokenString)().then(() => {
                  setShowCopiedFeedback(true);
                  setTimeout(() => {
                    setShowCopiedFeedback(false);
                  }, 2000);
                });
              }}
            >
              {t('actions:copy_verification_code')}
            </Button>
          )}
        </Grid>
        <Grid item xs={12}>
          <Typography>
            <Trans i18nKey="link_account:verification_code_hint">
              Click
              <Link
                target="_blank"
                rel="noreferrer"
                href={`https://studio.youtube.com/channel/${channel}/editing/details`}
              >
                here to access to your YouTube Studio
              </Link>
              and edit your channel description.
              Just paste the link anywhere in it and click the Publish button on the top right.
              You can remove the code from your channel&apos;s description after the verification is finished.
            </Trans>
          </Typography>
        </Grid>
        <Grid item xs={12} className={classes.stepAction}>
          <Button
            disabled={verifying}
            variant="contained"
            color="primary"
            size="large"
            onClick={handleVerifyChannelClicked}
          >
            {t('actions:verify_channel')}
          </Button>
          {verificationFailed && (
            <Box className={classes.errorBox}>
              <Typography>{t('link_account:verification_failed')}</Typography>
              <ul className={classes.list}>
                <li>
                  <Typography>
                    {t('link_account:verification_failed_hint')}
                  </Typography>
                </li>
                <li>
                  <Typography>
                    <Trans i18nKey="link_account:go_back_to_step_one_hint">
                      If the verification keeps failing,
                      <Link
                        className={classes.linkButton}
                        onClick={handleGoBackToStepOneClicked}
                      >
                        go back to step one
                      </Link>
                      and make sure you have pasted the correct URL to your
                      YouTube channel.
                    </Trans>
                  </Typography>
                </li>
              </ul>
            </Box>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};
