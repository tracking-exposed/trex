import React, { useState } from 'react';
import {
  Button,
  ButtonProps,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@material-ui/core';
import { useTranslation } from 'react-i18next';

interface UnlinkProfileButtonProps extends ButtonProps {
  onLogout: () => void;
}

const UnlinkProfileButton: React.FC<UnlinkProfileButtonProps> = (props) => {
  const [unlinkClicked, setUnlinkClicked] = useState(false);
  const { t } = useTranslation();

  const { onLogout, ...buttonProps } = props;

  const handleUnlinkClicked = (): void => {
    setUnlinkClicked(true);
  };

  const handleUnlinkCancelled = (): void => {
    setUnlinkClicked(false);
  };

  const handleUnlinkConfirmed = (): void => {
    setUnlinkClicked(false);
    onLogout();
  };


  return (
    <>
      <Button
        {...buttonProps}
        onClick={handleUnlinkClicked}
      >
        {t('actions:unlink_channel')}
      </Button>
      {unlinkClicked && (
        <Dialog
          open={unlinkClicked}
          onClose={() => setUnlinkClicked(false)}
          aria-labelledby={t('actions:unlink_channel')}
          aria-describedby={t('actions:unlink_channel')}
        >
          <DialogTitle id="unlink-channel-dialog">
            {t('actions:unlink_channel')}
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              {t('actions:unlink_channel_confirm_text')}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleUnlinkConfirmed}>
              {t('actions:unlink_channel_confirm_yes')}
            </Button>
            <Button onClick={handleUnlinkCancelled} color="primary">
              {t('actions:unlink_channel_confirm_no')}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
};

export default UnlinkProfileButton;
