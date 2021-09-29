import { Typography } from '@material-ui/core';
import Chip from '@material-ui/core/Chip';
import Grid from '@material-ui/core/Grid';
import { makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { useTranslation } from 'react-i18next';

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
    maxWidth: 960,
    backgroundColor: theme.palette.background.paper,
  },
  chip: {
    margin: theme.spacing(0.5),
  },
  section1: {
    margin: theme.spacing(3, 2),
  },
  section2: {
    margin: theme.spacing(2),
  },
  section3: {
    margin: theme.spacing(3, 1, 1),
  },
}));

export const YCAInalitics: React.FC = () => {
  const classes = useStyles();
  const { t } = useTranslation();
  return (
    <Grid container alignItems="center">
      <Grid item md={12}>
        <Typography variant="h4">
          {t('collaborativeAnalytics:faq_1_question')}
        </Typography>
        <Chip
          className={classes.chip}
          color="primary"
          label="Load video list"
        />
        <Chip
          className={classes.chip}
          color="secondary"
          label="Display recommended channels"
        />
        <Chip
          className={classes.chip}
          color="secondary"
          label="Display recommended videos"
        />
      </Grid>
      <Grid item md={12}>
        <Typography variant="h4">
          {t('collaborativeAnalytics:faq_1_question')}
        </Typography>
        <Chip className={classes.chip} color="primary" label="Load list" />
      </Grid>
      <Grid item md={12}>
        <Typography variant="h4">
          {t('collaborativeAnalytics:faq_3_question')}
        </Typography>
        <Chip className={classes.chip} color="primary" label="Load list" />
      </Grid>

      <Grid item md={12}>
        <Typography variant="h4">
          {t('collaborativeAnalytics:faq_4_question')}
        </Typography>
        <Chip
          className={classes.chip}
          color="primary"
          label="Load previous tests"
        />
      </Grid>
    </Grid>
  );
};
