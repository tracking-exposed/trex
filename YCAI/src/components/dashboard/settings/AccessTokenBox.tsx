import { ContentCreator } from '@shared/models/ContentCreator';
import {
  Box,
  Button,
  FormControl,
  FormGroup,
  FormHelperText,
  Grid,
  IconButton,
  Input,
  InputAdornment,
  InputLabel,
  makeStyles,
  Typography,
} from '@material-ui/core';
import CloudDownload from '@material-ui/icons/CloudDownload';
import VisibilityIcon from '@material-ui/icons/Visibility';
import VisibilityOffIcon from '@material-ui/icons/VisibilityOff';
import * as E from 'fp-ts/lib/Either';
import { APIError } from 'providers/api.provider';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { assignAccessToken } from '../../../state/creator.commands';
import { deleteProfile, downloadTXTFile } from '../../../state/public.commands';
import { YCAITheme } from '../../../theme';

interface AccessTokenBoxProps {
  profile: ContentCreator | null;
}

const useStyles = makeStyles<YCAITheme>((theme) => ({
  root: {
    marginBottom: theme.spacing(10),
  },
  formControl: {
    marginBottom: theme.spacing(2),
  },
}));

export const AccessTokenBox: React.FC<AccessTokenBoxProps> = ({ profile }) => {
  const { t } = useTranslation();

  const [token, setToken] = React.useState(profile?.accessToken ?? '');
  const [authTokenVisible, setAuthTokenVisible] = React.useState(token === '');
  const [error, setError] = React.useState<
    APIError | chrome.runtime.LastError | null
  >(null);

  const classes = useStyles();

  const tokenValue =
    token === '' ? '' : authTokenVisible ? token : 'ACTK********';

  return (
    <Box className={classes.root}>
      <Typography variant="h4" component="h2" color="textSecondary">
        {t('settings:access_token_title')}
      </Typography>
      <Typography color="textPrimary" gutterBottom>
        {t('settings:access_token_description')}
      </Typography>
      <FormGroup row={true}>
        <Grid
          container
          className={classes.formControl}
          spacing={2}
          justifyContent="flex-end"
          alignItems="flex-end"
        >
          <Grid item xs={9}>
            <FormControl fullWidth={true}>
              <InputLabel htmlFor="access-token">
                {t('settings:access_token')}
              </InputLabel>
              <Input
                fullWidth={true}
                value={tokenValue}
                readOnly={!authTokenVisible}
                onChange={(e) => {
                  setToken(e.target.value);
                }}
                endAdornment={
                  profile?.accessToken !== undefined ? (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={async () => {
                          setAuthTokenVisible(!authTokenVisible);
                        }}
                        edge="end"
                      >
                        {authTokenVisible ? (
                          <VisibilityOffIcon />
                        ) : (
                          <VisibilityIcon />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ) : null
                }
              />
              {error !== null ? (
                <FormHelperText error={true}>{error.message}</FormHelperText>
              ) : null}
            </FormControl>
          </Grid>
          <Grid item xs={3} style={{textAlign: 'right'}}>
            {profile?.accessToken !== undefined ? (
              <Button
                color="secondary"
                variant="outlined"
                size="small"
                startIcon={<CloudDownload />}
                onClick={() => {
                  void downloadTXTFile({
                    name: 'access-token.txt',
                    data: profile.accessToken,
                  })();
                }}
              >
                {t('actions:download')}
              </Button>
            ) : null}
          </Grid>
        </Grid>
        <Grid container spacing={2}>
          <Grid item xs={3}>
            <Button
              variant="outlined"
              color="primary"
              size="small"
              onClick={() => {
                setError(null);
                if (authTokenVisible) {
                  void assignAccessToken({ token })().then((c) => {
                    if (E.isLeft(c)) {
                      setError(c.left);
                    } else if (E.isRight(c)) {
                      if (c.right !== null) {
                        setAuthTokenVisible(!authTokenVisible);
                      }
                    }
                  });
                } else {
                  setAuthTokenVisible(true);
                }
              }}
            >
              {authTokenVisible ? t('actions:save_access_token') : t('actions:edit_access_token')}
            </Button>
          </Grid>
          <Grid item xs={3}>
            {profile?.accessToken !== undefined ? (
              <Button
                variant="outlined"
                color="secondary"
                size="small"
                onClick={() => {
                  void deleteProfile({})().then(() => {
                    setToken('');
                    setAuthTokenVisible(true);
                    setError(null);
                  });
                }}
              >
                {t('actions:unlink_profile')}
              </Button>
            ) : null}
          </Grid>
        </Grid>
      </FormGroup>
    </Box>
  );
};
