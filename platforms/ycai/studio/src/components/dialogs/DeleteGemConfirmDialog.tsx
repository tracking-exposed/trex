import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogProps,
  DialogTitle,
} from '@material-ui/core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

interface DeleteGemConfirmDialogProps extends DialogProps {
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteGemConfirmDialog: React.FC<DeleteGemConfirmDialogProps> = (
  props
) => {
  const { t } = useTranslation();
  return (
    <Dialog {...props}>
      <DialogTitle>{t('actions:delete')}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {t('actions:delete_gem_confirm_message')}
        </DialogContentText>

        <DialogActions style={{ padding: 10 }}>
          <Button variant="contained" onClick={() => props.onCancel()}>
            {t('actions:cancel')}
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => props.onConfirm()}
          >
            {t('actions:delete')}
          </Button>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteGemConfirmDialog;
