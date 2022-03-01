import { Box, Button, IconButton, makeStyles } from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import { Recommendation } from '@shared/models/Recommendation';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { YCAITheme } from '../../theme';
import DeleteGemConfirmDialog from '../dialogs/DeleteGemConfirmDialog';

const useStyles = makeStyles<YCAITheme>((theme) => ({
  button: {
    fontWeight: 'bold',
    lineHeight: 1,
    marginRight: theme.spacing(2),
    minWidth: 0,
    padding: 0,
  },
  arrowButton: {
    '&:disabled': {
      color: theme.palette.grey[500],
    },
  },
}));

interface DeleteGemButtonProps {
  data: Recommendation;
  variant?: 'icon' | 'label';
  onDeleteClick: (d: Recommendation) => void;
}

const DeleteGemButton: React.FC<DeleteGemButtonProps> = ({
  data,
  variant = 'label',
  onDeleteClick,
}) => {
  const { t } = useTranslation();
  const classes = useStyles();
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false);

  const handleDeleteConfirmation = (): void => {
    onDeleteClick(data);
    setShowConfirmDialog(false);
  };

  const button =
    variant === 'icon' ? (
      <IconButton
        aria-label={t('actions:move_recommendation_up')}
        color="primary"
        className={classes.arrowButton}
        // there seems to be an eslint bug,
        // there is no way to get rid of all the warnings whatever I do
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        onClick={() => setShowConfirmDialog(true)}
        size="small"
      >
        <DeleteIcon />
      </IconButton>
    ) : (
      <Button
        className={classes.button}
        onClick={() => setShowConfirmDialog(true)}
        size="small"
        variant="text"
      >
        {t('actions:delete_recommendation_button')}
      </Button>
    );

  return (
    <Box>
      {button}
      <DeleteGemConfirmDialog
        open={showConfirmDialog}
        onConfirm={handleDeleteConfirmation}
        onCancel={() => setShowConfirmDialog(false)}
      />
    </Box>
  );
};

export default DeleteGemButton;
