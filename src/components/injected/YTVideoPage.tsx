import { AppBar, Box, Tabs, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { FullSizeLoader } from 'components/common/FullSizeLoader';
import { TabPanel } from 'components/common/TabPanel';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { GetLogger } from 'utils/logger.utils';
import { getVideoId } from 'utils/yt.utils';
import { Tab } from '../common/Tab';
import { VideoRecommendations } from '../dashboard/VideoRecommendations';

const logger = GetLogger('yt-video-recommendations');

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
let checkURLInterval: number = 0;
export const YTVideoPage: React.FC = () => {
  const { t } = useTranslation();
  const [currentTab, setCurrentTab] = React.useState(0);
  const [currentVideoId, setVideoId] = React.useState(
    getVideoId(window.location.href)
  );

  ytItemsRendererEl = React.useMemo(
    () =>
      document.getElementsByTagName(
        'ytd-watch-next-secondary-results-renderer'
      )[0],
    [ytItemsRendererEl]
  );

  const ytItemsRendererElClasses = React.useMemo(
    () => ytItemsRendererEl?.className ?? '',
    [ytItemsRendererEl]
  );

  const classes = useStyles();

  const patchYTRecommendations = (tab: number): void => {
    if (typeof ytItemsRendererEl === 'object' && ytItemsRendererEl !== null) {
      // tab n2 = youtube, tab1 = community
      if (tab === 2) {
        ytItemsRendererEl.className = ytItemsRendererElClasses;
      } else {
        ytItemsRendererEl.className = `${ytItemsRendererElClasses}  + ${classes.ytItemshidden}`;
      }
    }
  }

  const onTabChange = React.useCallback(
    (tab: number) => {
      setCurrentTab(tab);
      patchYTRecommendations(tab);
    },
    []
  );

  React.useEffect(() => {
    logger.debug('Mounting component at url %s', window.location.href);
    patchYTRecommendations(currentTab);
    checkURLInterval = window.setInterval(() => {
      logger.debug('Video recommendations interval...');
      const newVideoId = getVideoId(document.location.href);
      if (currentVideoId !== newVideoId) {
        logger.debug(
          'Video id changed from (%s) to (%s)',
          currentVideoId,
          newVideoId
        );
        setVideoId(newVideoId);
      }
    }, 2000);

    return () => {
      logger.debug('Clearing interval %o', checkURLInterval)
      window.clearInterval(checkURLInterval);
    };
  }, [currentVideoId]);

  return (
    <Box>
      <Box>
        <AppBar className={classes.appBar} position="static">
          <Tabs
            value={currentTab}
            onChange={(e, n) => onTabChange(n)}
            aria-label="recommendations tabs"
            variant="fullWidth"
          >
            <Tab className={classes.tab} label={t('creator:title')} index={0} />
            <Tab
              className={classes.tab}
              label={t('statistics:title')}
              index={1}
            />
            <Tab className={classes.tab} label={t('youtube:title')} index={2} />
          </Tabs>
        </AppBar>

        <TabPanel value={currentTab} index={0}>
          {currentVideoId === undefined ? (
            <Box>
              <FullSizeLoader />
            </Box>
          ) : (
            <VideoRecommendations
              queries={{ videoRecommendations: { videoId: currentVideoId } }}
            />
          )}
        </TabPanel>
        <TabPanel value={currentTab} index={1}>
          <Typography variant="h4">{t('common:coming_soon')}</Typography>
        </TabPanel>
      </Box>
    </Box>
  );
};
