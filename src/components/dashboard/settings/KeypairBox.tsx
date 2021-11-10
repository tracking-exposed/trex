import {
  Box,
  Button,
  FormControl,
  FormGroup,
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
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Keypair, Settings } from '../../../models/Settings';
import {
  deleteKeypair,
  downloadTXTFile,
  generateKeypair,
  updateSettings,
} from '../../../state/public.commands';

interface KeypairBoxProps {
  keypair: Keypair;
  settings: Settings;
}

const useStyles = makeStyles(() => ({
  root: {
    marginBottom: 100,
  },
  formControl: {
    marginBottom: 16,
  },
}));

export const KeypairBox: React.FC<KeypairBoxProps> = ({
  keypair,
  settings,
}) => {
  const { t } = useTranslation();
  const [publicKeyVisible, setPublicKeyVisible] = React.useState(false);
  const [privateKeyVisible, setPrivateKeyVisible] = React.useState(false);
  const classes = useStyles();
  return (
    <Box className={classes.root} style={{ width: '100%' }}>
      <Typography variant="h4">{t('settings:keypair_title')}</Typography>
      {keypair === null ? (
        <Box>
          <Button
            variant="contained"
            color="secondary"
            size="small"
            onClick={() => {
              void generateKeypair({})();
            }}
          >
            {t('actions:generate_keypair')}
          </Button>
        </Box>
      ) : (
        <FormGroup>
          <Grid
            container
            className={classes.formControl}
            spacing={2}
            alignItems="flex-end"
            justifyContent="flex-end"
          >
            <Grid item md={5}>
              <FormControl fullWidth={true}>
                <InputLabel htmlFor="keypair-private-key">
                  {t('settings:keypair_public_key')}
                </InputLabel>
                <Input
                  fullWidth={true}
                  value={
                    publicKeyVisible
                      ? keypair.publicKey
                      : keypair.publicKey.substr(0, 5).concat('********')
                  }
                  endAdornment={
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={async () => {
                          setPublicKeyVisible(!publicKeyVisible);
                          setTimeout(() => {
                            setPublicKeyVisible(publicKeyVisible);
                          }, 2000);
                        }}
                        edge="end"
                      >
                        {publicKeyVisible ? (
                          <VisibilityOffIcon />
                        ) : (
                          <VisibilityIcon />
                        )}
                      </IconButton>
                    </InputAdornment>
                  }
                />
              </FormControl>
            </Grid>
            <Grid item md={5}>
              <FormControl fullWidth={true}>
                <InputLabel htmlFor="keypair-private-key">
                  {t('settings:keypair_private_key')}
                </InputLabel>
                <Input
                  fullWidth={true}
                  value={
                    privateKeyVisible
                      ? keypair.secretKey
                      : keypair.secretKey.substr(0, 5).concat('********')
                  }
                  endAdornment={
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={async () => {
                          setPrivateKeyVisible(!privateKeyVisible);
                          setTimeout(() => {
                            setPrivateKeyVisible(privateKeyVisible);
                          }, 2000);
                        }}
                        edge="end"
                      >
                        {privateKeyVisible ? (
                          <VisibilityOffIcon />
                        ) : (
                          <VisibilityIcon />
                        )}
                      </IconButton>
                    </InputAdornment>
                  }
                />
              </FormControl>
            </Grid>
            <Grid item md={2} style={{ textAlign: 'right' }}>
              <Button
                variant="outlined"
                size="small"
                color="secondary"
                startIcon={<CloudDownload />}
                onClick={() => {
                  void downloadTXTFile({
                    name: 'anonymous-identity.txt',
                    data: `publicKey: ${keypair.publicKey} \n secretKey: ${keypair.secretKey}\n`,
                  })();
                }}
              >
                {t('actions:download')}
              </Button>
            </Grid>
          </Grid>
          <Grid container spacing={2}>
            <Grid item md={6}>
              <Button
                variant="outlined"
                color="secondary"
                size="small"
                onClick={() => {
                  void generateKeypair({})();
                }}
              >
                {t('actions:refresh_keypair')}
              </Button>
            </Grid>
            <Grid item md={6} style={{ textAlign: 'right' }}>
              <Button
                variant="outlined"
                color="primary"
                size="small"
                onClick={() => {
                  void deleteKeypair({})();
                  void updateSettings({
                    ...settings,
                    independentContributions: false,
                  })();
                }}
              >
                {t('actions:delete_keypair')}
              </Button>
            </Grid>
          </Grid>
        </FormGroup>
      )}
    </Box>
  );
};
