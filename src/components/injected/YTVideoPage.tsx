import { AppBar, Box, Tabs, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { TabPanel } from 'components/common/TabPanel';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { getVideoId } from 'utils/yt.utils';
import { Tab } from '../common/Tab';
import { VideoRecommendations } from '../dashboard/VideoRecommendations';

const useStyles = makeStyles(() => ({
  appBar: {
    marginBottom: 20,
  },
  tab: {
    minWidth: 100,
  },
  ytItemsVisible: {
    display: 'block',
  },
  ytItemshidden: {
    display: 'none',
  },
}));

let ytItemsRendererEl: Element | null = null;

export const YTVideoPage: React.FC = () => {
  const { t } = useTranslation();
  const [currentTab, setValue] = React.useState(0);
  const videoId = React.useMemo(
    () => getVideoId(window.location.href),
    [window.location.href]
  );

  ytItemsRendererEl = React.useMemo(
    () =>
      document.getElementsByTagName(
        'ytd-watch-next-secondary-results-renderer'
      )[0],
    [ytItemsRendererEl === null]
  );

  const ytItemsRendererElClasses = React.useMemo(
    () => ytItemsRendererEl?.className ?? '',
    [ytItemsRendererEl === null]
  );

  const classes = useStyles();

  React.useEffect(() => {
    if (typeof ytItemsRendererEl === 'object' && ytItemsRendererEl !== null) {
      // tab n2 = youtube, tab1 = community
      if (currentTab === 2) {
        ytItemsRendererEl.className = ytItemsRendererElClasses;
      } else {
        ytItemsRendererEl.className = `${ytItemsRendererElClasses}  + ${classes.ytItemshidden}`;
      }
    }
  }, [currentTab]);

  return (
    <Box>
      {videoId === undefined ? (
        <Typography variant="h3">{t('videos:no_video_id')}</Typography>
      ) : (
        <Box>
          <AppBar className={classes.appBar} position="static">
            <Tabs
              value={currentTab}
              onChange={(e, n) => setValue(n)}
              aria-label="recommendations tabs"
              variant="fullWidth"
            >
              <Tab
                className={classes.tab}
                label={t('creator:title')}
                index={0}
              />
              <Tab
                className={classes.tab}
                label={t('statistics:title')}
                index={1}
              />
              <Tab
                className={classes.tab}
                label={t('youtube:title')}
                index={2}
              />
            </Tabs>
          </AppBar>

          <TabPanel value={currentTab} index={0}>
            <VideoRecommendations videoId={videoId} />
          </TabPanel>
          <TabPanel value={currentTab} index={1}>
            <Typography variant="h4">{t('common:coming_soon')}</Typography>
          </TabPanel>
        </Box>
      )}
    </Box>
  );
};
