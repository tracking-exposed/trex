import React from 'react';

import { useTranslation } from 'react-i18next';

import {
  Box,
  Card,
  CardContent,
  Button,
  TextField,
  Typography,
} from '@material-ui/core';

import { makeStyles } from '@material-ui/styles';

import { addRecommendationForVideo } from '../../../state/creator.commands';
import { YCAITheme } from '../../../theme';

interface AddRecommendationBoxProps {
  videoId: string;
}

const useStyles = makeStyles<YCAITheme>(theme => ({
  root: {
    border: `2px dashed ${theme.palette.secondary.main}`,
    boxShadow: 'none',
  },
  textField: {
    flexGrow: 1,
  },
  addButton: {
    marginLeft: theme.spacing(2),
  },
}));

const AddRecommendationBox: React.FC<AddRecommendationBoxProps> = ({ videoId }) => {
  const { t } = useTranslation();
  const [recommendationURL, setRecommendationURL] = React.useState('');
  const classes = useStyles();

  const onAddClick = async (): Promise<void> => {
    void addRecommendationForVideo({
      videoId, recommendationURL,
    }, {
      videoRecommendations: { videoId },
    })();
    setRecommendationURL('');
  };

  return (
      <Card className={classes.root}>
        <CardContent>
          <Typography component="h2" variant="h5" color="secondary">
            {t('recommendations:add_to_video')}
          </Typography>
          <Box display="flex" alignItems="center">
            <TextField
              className={classes.textField}
              label={t('recommendations:url')}
              placeholder={t('recommendations:url_placeholder')}
              helperText={t('recommendations:url_helper_text')}
              multiline
              value={recommendationURL}
              onChange={(v) => setRecommendationURL(v.target.value)}
              color="secondary"
            />
            <Button
              className={classes.addButton}
              variant="contained"
              color="secondary"
              onClick={onAddClick}
            >
              {t('actions:add')}
            </Button>
          </Box>
        </CardContent>
      </Card>
  );
};

export default AddRecommendationBox;
