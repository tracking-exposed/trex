import {
  Box,
  LinearProgress,
  Link,
  List,
  ListItem,
  Typography,
  useTheme,
} from '@material-ui/core';
import * as QR from 'avenger/lib/QueryResult';
import { WithQueries } from 'avenger/lib/react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { makeStyles } from '../../../theme';
import { ccRelatedUsers } from '../../../state/dashboard/creator.queries';
import { EmptyList } from '../../common/EmptyList';
import { ErrorBox } from '../../common/ErrorBox';
import { LazyFullSizeLoader } from '../../common/FullSizeLoader';

const useStyles = makeStyles((theme) => ({
  root: {},
  listItem: {
    height: 40,
    width: '100%',
    '& .MuiLinearProgress-bar': {
      backgroundColor: theme.palette.grey[100],
    },
    '& :hover .MuiLinearProgress-bar': {
      backgroundColor: theme.palette.primary.main,
    },
  },
  bar: {
    height: 30,
    borderRadius: 5,
    backgroundColor: 'transparent',
  },
}));

interface CCRelatedUserListProps {
  channelId: string;
  amount: number;
  skip: number;
}

export const CCRelatedUserList: React.FC<CCRelatedUserListProps> = ({
  amount,
  skip,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const classes = useStyles();

  return (
    <WithQueries
      queries={{ ccRelatedUsers }}
      params={{ ccRelatedUsers: { params: { amount, skip } } }}
      render={QR.fold(LazyFullSizeLoader, ErrorBox, ({ ccRelatedUsers }) => {
        if (ccRelatedUsers.length === 0) {
          return <EmptyList resource={t('creator:title')} />;
        }
        return (
          <List className={classes.root}>
            {ccRelatedUsers.map((u, i) => (
              <ListItem key={u.channelId} className={classes.listItem}>
                <Box
                  style={{ height: 40, width: '100%', position: 'absolute' }}
                >
                  <Box
                    display="flex"
                    alignItems="center"
                    style={{
                      width: '100%',
                      position: 'absolute',
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
                        variant="body2"
                        color="textSecondary"
                      >{`${Math.round(u.percentage)}%`}</Typography>
                    </Box>
                  </Box>

                  <Link
                    href={`https://www.youtube.com/results?search_query=${u.channelId}`}
                    target="_blank"
                    rel="noreferrer"
                    variant="h6"
                    color="textSecondary"
                    style={{
                      position: 'absolute',
                      height: 20,
                      padding: theme.spacing(1),
                    }}
                  >
                    {u.channelId}
                  </Link>
                </Box>
              </ListItem>
            ))}
          </List>
        );
      })}
    />
  );
};
