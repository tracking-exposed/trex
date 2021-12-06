import React from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { useTranslation } from 'react-i18next';
import { isLeft } from 'fp-ts/lib/Either';

import { assignAccessToken } from '../../state/dashboard/creator.commands';
import { doUpdateCurrentView } from '../../utils/location.utils';

const useStyles = makeStyles(theme => ({
  content: {
    minWidth: '500px',
  },
  error: {
    marginTop: theme.spacing(1),
  }
}));

interface TokenLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TokenLoginModal: React.FC<TokenLoginModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();
  const classes = useStyles();
  const [token, setToken] = React.useState('');
  const [error, setError] = React.useState('');

  const handleSubmit = (): void => {
    void assignAccessToken({ token })().then((resp) => {
      if (isLeft(resp)) {
        setError(t('link_account:token_authentication_failed'));
      } else {
        onClose();
        void doUpdateCurrentView({ view: 'analytics' })();
      }
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter') {
      void handleSubmit();
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
    >
      <DialogTitle>
        {t('link_account:token_modal_title')}
      </DialogTitle>
      <DialogContent className={classes.content}>
        <DialogContentText>
          {t('link_account:token_modal_description')}
        </DialogContentText>
        <TextField
          fullWidth
          label={t('settings:access_token')}
          value={token}
          onChange={(e) => setToken(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        {error && (
          <DialogContentText className={classes.error}>
            {error}
          </DialogContentText>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          {t('actions:cancel')}
        </Button>
        <Button color="primary" onClick={handleSubmit}>
          {t('link_account:token_modal_submit')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TokenLoginModal;
