import Chip from '@material-ui/core/Chip';
import Grid from '@material-ui/core/Grid';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import React from 'react';

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

export default function YCAInalitics() {
  const classes = useStyles();
  return (
    <Grid container alignItems="center">
      <Grid item md={12}>
        <h2>Which videos are recommended close to yours video?</h2>
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
        <h2>Where your videos appears as recommended?</h2>
        <Chip className={classes.chip} color="primary" label="Load list" />
      </Grid>
      <Grid item md={12}>
        <h2>Which advertising get served over your videos?</h2>
        <Chip className={classes.chip} color="primary" label="Load list" />
      </Grid>

      <Grid item md={12}>
        <h2>Shadow-banning analysis</h2>
        <Chip
          className={classes.chip}
          color="primary"
          label="Load previous tests"
        />
      </Grid>
    </Grid>
  );
}
