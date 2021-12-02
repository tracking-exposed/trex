import React, { useState } from 'react';

import {
  Button,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Typography,
} from '@material-ui/core';
import { Edit as EditIcon } from '@material-ui/icons';
import { makeStyles } from '@material-ui/styles';

import { useTranslation } from 'react-i18next';
import { Recommendation } from '@shared/models/Recommendation';
import Image from '../../common/Image';
import { YCAITheme } from '../../../theme';
import { patchRecommendation } from '../../../state/dashboard/creator.commands';

interface EditRecommendationProps {
  data: Recommendation;
  videoId: string;
}

const useClasses = makeStyles<YCAITheme>((theme) => ({
  image: {
    height: 250,
    marginBottom: theme.spacing(2),
    objectFit: 'cover',
  },
  textField: {
    '& input': {
      color: theme.palette.common.black,
    },
    '& textarea': {
      color: theme.palette.common.black,
    },
  }
}));

const EditRecommendation: React.FC<EditRecommendationProps> = ({ data, videoId }) => {
  const { t } = useTranslation();
  const [formIsOpen, setFormIsOpen] = useState(false);
  const [title, setTitle] = useState(data.title);
  const [description, setDescription] = useState(data.description);
  const classes = useClasses();

  const handleSubmit = (): void => {
    void patchRecommendation({
      urlId: data.urlId,
      data: {
        title,
        description,
      }
    }, {
      videoRecommendations: { videoId }
    })();
  };

  const dirty = title !== data.title
    || (
      description !== data.description
        &&  !(description === '' && data.description === undefined)
    );

  return (
    <>
      <IconButton
        aria-label={t('actions:edit_recommendation')}
        color="primary"
        size="small"
        onClick={() => { setFormIsOpen(true); }}
      >
        <EditIcon />
      </IconButton>
      {formIsOpen && (
        <Dialog
          open={formIsOpen}
          onClose={() => setFormIsOpen(false)}
        >
          <DialogTitle>{t('actions:edit_recommendation')}</DialogTitle>
          <Image src={data.image} alt={data.title} className={classes.image} />
          <DialogContent>
            <DialogContentText>
              <Typography>
                {t('actions:edit_recommendation_description')}
              </Typography>
            </DialogContentText>
            <TextField
              className={classes.textField}
              fullWidth
              label={t('recommendations:title')}
              onChange={(e) => setTitle(e.target.value)}
              value={title}
              />
            <TextField
              className={classes.textField}
              fullWidth
              label={t('recommendations:description')}
              onChange={(e) => setDescription(e.target.value)}
              multiline
              rows={2}
              value={description}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setFormIsOpen(false)}>
              {t('actions:cancel')}
            </Button>
            <Button
              color="primary"
              disabled={!dirty}
              onClick={handleSubmit}
            >
              {t('actions:save')}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
};

export default EditRecommendation;
