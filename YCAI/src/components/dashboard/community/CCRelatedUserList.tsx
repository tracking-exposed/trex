import {
  Box,
  LinearProgress,
  Link,
  List,
  ListItem,
  Typography,
  useTheme,
} from '@material-ui/core';
import { ChannelRelated } from '@trex/shared/models/ChannelRelated';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { makeStyles } from '../../../theme';
import { EmptyList } from '../../common/EmptyList';

const useStyles = makeStyles((theme) => ({
  root: {},
  listItem: {
    width: '100%',
    '& .MuiLinearProgress-root': {
      border: `2px solid ${theme.palette.grey[100]}`,
    },
    '& .MuiLinearProgress-bar': {
      backgroundColor: theme.palette.grey[500],
    },
    '& :hover .MuiLinearProgress-bar': {
      backgroundColor: theme.palette.primary.main,
    },
  },
  bar: {
    height: 15,
    borderRadius: theme.spacing(1),
    backgroundColor: 'transparent',
  },
}));

interface CCRelatedUserListProps {
  channels: ChannelRelated[];
}

export const CCRelatedUserList: React.FC<CCRelatedUserListProps> = ({
  channels,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const classes = useStyles();

  if (channels.length === 0) {
    return <EmptyList resource={t('creator:title')} />;
  }
  return (
    <List className={classes.root} disablePadding={true}>
      {channels.map((u, i) => (
        <ListItem key={u.recommendedSource} className={classes.listItem}>
          <Box style={{ width: '100%' }}>
            <Link
              href={`https://www.youtube.com/results?search_query=${u.recommendedSource}`}
              target="_blank"
              rel="noreferrer"
              variant="h6"
              style={{
                paddingBottom: theme.spacing(1),
                color: theme.palette.grey[500],
              }}
            >
              {u.recommendedSource}
            </Link>
            <Box
              display="flex"
              alignItems="center"
              style={{
                width: '100%',
                height: '100%',
              }}
            >
              <Box width="100%" mr={1}>
                <LinearProgress
                  className={classes.bar}
                  variant="determinate"
                  value={u.percentage}
                />
              </Box>
              <Box minWidth={35}>
                <Typography
                  variant="body1"
                  color="textSecondary"
                  style={{ marginBottom: 10 }}
                >{`${Math.round(u.percentage)}%`}</Typography>
              </Box>
            </Box>
          </Box>
        </ListItem>
      ))}
    </List>
  );
};
