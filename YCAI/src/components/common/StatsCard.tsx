import { Card, CardContent, Typography } from '@material-ui/core';
import { YCAITheme, makeStyles, useTheme } from '../../theme';
import * as React from 'react';
import * as NumberUtils from '@shared/utils/number.utils';

interface StatsBoxProps {
  header: string;
  icon?: React.ReactElement;
  count: number;
  color?: string;
}

const useStyles = makeStyles<YCAITheme, { color: string }>((theme) => ({
  root: {
    marginBottom: 20,
    border: (props) => `1px solid ${props.color}`,
    '&:hover': {
      backgroundColor: theme.palette.grey[100],
    },
  },
  content: {
    textAlign: 'center',
    color: (props) => props.color,
  },
}));

export const StatsCard: React.FC<StatsBoxProps> = ({
  header,
  count,
  icon,
  color,
}) => {
  const theme = useTheme();
  const classes = useStyles({ color: color ?? theme.palette.text.primary });
  return (
    <Card className={classes.root}>
      <CardContent className={classes.content}>
        {icon ?? null}
        <Typography variant="h5">{header}</Typography>
        <Typography variant="h3">{NumberUtils.formatter.format(count)}</Typography>
      </CardContent>
    </Card>
  );
};
