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

import {
  Add as AddIcon,
} from '@material-ui/icons';

import { makeStyles } from '@material-ui/styles';

import { addRecommendationForVideo } from '../../../state/dashboard/creator.commands';
import { YCAITheme } from '../../../theme';

interface AddRecommendationBoxProps {
  videoId: string;
}

const useStyles = makeStyles<YCAITheme>(theme => ({
  root: {
    backgroundColor: theme.palette.grey[300],
  },
  textField: {
    backgroundColor: theme.palette.background.default,
    flexGrow: 1,
    '& .MuiFormHelperText-root': {
      backgroundColor: theme.palette.grey[300],
    },
    '& textarea': {
      color: theme.palette.text.secondary,
    }
  },
  addButton: {
    marginLeft: theme.spacing(2),
    color: theme.palette.common.black,
    fontWeight: 'bold',
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
          <Typography
            color="textSecondary"
            component="h2"
            variant="h4"
          >
            {t('recommendations:add_to_video')}
            <AddIcon fontSize="large"/>
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
              color="primary"
            />
            <Button
              className={classes.addButton}
              variant="contained"
              color="primary"
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
