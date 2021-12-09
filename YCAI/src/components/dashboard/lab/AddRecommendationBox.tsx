import React from 'react';

import { useTranslation } from 'react-i18next';

import {
  Box,
  Card,
  CardContent,
  Button,
  TextField,
  Typography,
  Divider,
} from '@material-ui/core';

import { makeStyles } from '@material-ui/styles';

import { addRecommendationForVideo } from '../../../state/dashboard/creator.commands';
import { YCAITheme } from '../../../theme';

interface AddRecommendationBoxProps {
  videoId: string;
}

const useStyles = makeStyles<YCAITheme>(theme => ({
  root: {
    backgroundColor: 'transparent',
    boxShadow: 'none',
    paddingTop: '0px',
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
    marginLeft: theme.spacing(3),
    color: theme.palette.common.white,
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
      <Card className={classes.root} >
        <CardContent style={{paddingLeft: '0px', paddingTop: '0px'}}>
        <Divider light style={{marginBottom: '24px' }}/>
          <Typography
            color="primary"
            component="h2"
            variant="h5"
          >
            {t('recommendations:add_to_video')}
          </Typography>
          <Box display="flex" alignItems="center">
            <TextField
              className={classes.textField}
              label={t('recommendations:url')}
              placeholder={t('recommendations:url_placeholder')}
              multiline
              value={recommendationURL}
              onChange={(v) => setRecommendationURL(v.target.value)}
              variant="filled"
              color="primary"
              focused
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
