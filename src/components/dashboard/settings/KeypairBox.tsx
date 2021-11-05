import {
  Box,
  Button,
  ButtonGroup,
  FormControl,
  FormGroup,
  IconButton,
  Input,
  InputAdornment,
  InputLabel,
  makeStyles,
  Typography,
} from '@material-ui/core';
import { Keypair, Settings } from '../../../models/Settings';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import VisibilityIcon from '@material-ui/icons/Visibility';
import VisibilityOffIcon from '@material-ui/icons/VisibilityOff';
import { deleteKeypair, updateSettings } from '../../../state/public.commands';

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
      <FormGroup>
        <FormControl className={classes.formControl}>
          <InputLabel htmlFor="keypair-private-key">
            {t('settings:keypair_public_key')}
          </InputLabel>
          <Input
            fullWidth={true}
            value={publicKeyVisible ? keypair.publicKey : '********'}
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
        <FormControl className={classes.formControl}>
          <InputLabel htmlFor="keypair-private-key">
            {t('settings:keypair_private_key')}
          </InputLabel>
          <Input
            fullWidth={true}
            value={privateKeyVisible ? keypair.secretKey : '********'}
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
      </FormGroup>
      <ButtonGroup style={{ marginTop: 10 }}>
        <Button
          variant="outlined"
          color="primary"
          onClick={() => {
            void deleteKeypair({})();
            void updateSettings({
              ...settings,
              indipendentContributions: false,
            })();
          }}
        >
          {t('actions:delete_keypair')}
        </Button>
        <Button variant="outlined" color="secondary" onClick={() => {}}>
          {t('actions:download_keypair')}
        </Button>
      </ButtonGroup>
    </Box>
  );
};
