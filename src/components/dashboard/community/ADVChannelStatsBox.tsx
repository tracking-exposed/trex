import { Box, Typography } from '@material-ui/core';
import * as QR from 'avenger/lib/QueryResult';
import { WithQueries } from 'avenger/lib/react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { creatorADVStatsMocked } from '../../../state/creator.queries';
import { makeStyles } from '../../../theme';
import { ErrorBox } from '../../common/ErrorBox';
import { LazyFullSizeLoader } from '../../common/FullSizeLoader';
import TreeMapGraph from '../../common/graphs/TreeMapGraph';

const useStyles = makeStyles((theme) => ({
  root: {
    background: theme.palette.grey[300],
    padding: theme.spacing(2),
    borderRadius: theme.spacing(1),
  },
}));

export const ADVChannelStatsBox: React.FC = () => {
  const { t } = useTranslation();
  const classes = useStyles();

  return (
    <Box className={classes.root}>
      <Typography color="primary" variant="h5">
        {t('statistics:advertising_connected_to_your_videos_title')}
      </Typography>
      <Typography color="primary" variant="subtitle1">
        {t('statistics:advertising_connected_to_your_videos_subtitle')}
      </Typography>
      <WithQueries
        queries={{
          creatorADVStats: creatorADVStatsMocked,
        }}
        render={QR.fold(LazyFullSizeLoader, ErrorBox, ({ creatorADVStats }) => {
          const treeData = {
            id: 'ADV',
            ...creatorADVStats.reduce(
              (acc, c) => ({
                value: acc.value + c.count,
                children: acc.children.concat({
                  id: c.sponsoredName,
                  value: c.count,
                  size: c.count,
                  parent: 'ADV',
                  children: [],
                }),
              }),
              { value: 0, children: [] as any[] }
            ),
          };

          return <TreeMapGraph data={treeData} />;
        })}
      />
    </Box>
  );
};
