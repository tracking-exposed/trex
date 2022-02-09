import { Button, Grid, Typography } from '@material-ui/core';
import { ContentCreator } from '@shared/models/ContentCreator';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { updateAccountLinkCompleted } from '../../../../state/dashboard/creator.commands';
import { makeStyles } from '../../../../theme';
import { doUpdateCurrentView } from '../../../../utils/location.utils';

const useStyles = makeStyles((theme) => ({
  box: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(2),
  },
  message: {
    fontSize: theme.spacing(5),
    fontWeight: theme.typography.caption.fontWeight,
    marginBottom: 60,
  },
}));

interface CongratsProps {
  profile: ContentCreator;
}

const Congrats: React.FC<CongratsProps> = ({ profile }) => {
  const { t } = useTranslation();
  const classes = useStyles();

  const handleNextClick = (): void => {
    void updateAccountLinkCompleted({ completed: true })().then(() =>
      doUpdateCurrentView({ view: 'recommendationsLibrary' })()
    );
  };

  return (
    <Grid item xs={8} sm={6} className={classes.box}>
      <Typography component="div" className={classes.message}>
        {t('congrats:message')}
      </Typography>
      <Grid>
        <Button
          size="large"
          variant="contained"
          color="primary"
          onClick={handleNextClick}
        >
          Go to gem library
        </Button>
      </Grid>
    </Grid>
  );
};

export default Congrats;
