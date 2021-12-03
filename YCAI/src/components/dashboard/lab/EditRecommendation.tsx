import React, { useState } from 'react';

import {
  Button,
  ButtonProps,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';

import { useTranslation } from 'react-i18next';
import {
  titleMaxLength,
  descriptionMaxLength,
  Recommendation,
} from '@shared/models/Recommendation';
import Image from '../../common/Image';
import { YCAITheme } from '../../../theme';
import { patchRecommendation } from '../../../state/dashboard/creator.commands';
import CharLimitedInput from '../../common/CharLimitedInput';

interface EditRecommendationProps extends ButtonProps {
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
    marginTop: theme.spacing(2),
    '& input': {
      color: theme.palette.common.black,
    },
    '& textarea': {
      color: theme.palette.common.black,
    },
  }
}));

const EditRecommendation: React.FC<EditRecommendationProps> = ({ data, videoId, ...props }) => {
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
      <Button {...props} variant="text" onClick={() => { setFormIsOpen(true); }}>
        {t('actions:edit_recommendation_button')}
      </Button>
      {formIsOpen && (
        <Dialog
          open={formIsOpen}
          onClose={() => setFormIsOpen(false)}
        >
          <DialogTitle>{t('actions:edit_recommendation_form_title')}</DialogTitle>
          <Image src={data.image} alt={data.title} className={classes.image} />
          <DialogContent>
            <DialogContentText>
              <Typography>
                {t('actions:edit_recommendation_description')}
              </Typography>
            </DialogContentText>
            <CharLimitedInput
              className={classes.textField}
              fullWidth
              label={t('recommendations:title')}
              limit={titleMaxLength}
              onChange={
                (str) => setTitle(str)
              }
              value={title}
            />
            <CharLimitedInput
              className={classes.textField}
              fullWidth
              label={t('recommendations:description')}
              limit={descriptionMaxLength}
              onChange={
                (str) => setDescription(str)
              }
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
