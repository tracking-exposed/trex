import React from 'react';
import FormHelperText from '@material-ui/core/FormHelperText';
import { makeStyles, Divider as MUIDivider } from '@material-ui/core';

const divStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
}));

const Divider = ({ helperText }) => {
  const classes = divStyles();
  return (
    <div className={classes.root}>
      <FormHelperText>{helperText}</FormHelperText>
      <MUIDivider />
    </div>
  );
};

export default Divider;
