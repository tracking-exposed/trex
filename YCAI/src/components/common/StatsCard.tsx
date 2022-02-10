import { Card, CardContent, Typography } from '@material-ui/core';
import * as NumberUtils from '@trex/shared/utils/number.utils';
import * as React from 'react';
import { makeStyles, useTheme } from '../../theme';

interface StatsBoxProps {
  header: string;
  icon?: React.ReactElement;
  count: number;
  color?: string;
}

const useStyles = makeStyles<{ color: string }>((theme) => ({
  root: {
    marginBottom: 20,
    width: '100%',
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
  const classes = useStyles({ color: color ?? theme.palette.grey[500] });
  return (
    <Card className={classes.root} elevation={0}>
      <CardContent className={classes.content} style={{ paddingBottom: 0 }}>
        {icon ?? null}
        <Typography variant="h5">{header}</Typography>
        <Typography variant="h2" style={{ marginBottom: 0 }}>
          {NumberUtils.formatter.format(count)}
        </Typography>
      </CardContent>
    </Card>
  );
};
