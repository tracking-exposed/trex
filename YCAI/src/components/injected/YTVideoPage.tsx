import { AppBar, Box, Tabs, Typography } from '@material-ui/core';
import ContentCreatorIcon from '@material-ui/icons/HealingOutlined';
import HideIcon from '@material-ui/icons/VisibilityOffOutlined';
import YTIcon from '@material-ui/icons/YouTube';
import { makeStyles } from '@material-ui/styles';
import * as TE from 'fp-ts/lib/TaskEither';
import { pipe } from 'fp-ts/lib/function';
import { FullSizeLoader } from '../common/FullSizeLoader';
import { TabPanel } from '../common/TabPanel';
import { Settings } from '../../models/Settings';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { useTranslation } from 'react-i18next';
import { GetLogger } from '@shared/logger';
import { getVideoId } from '../../utils/yt.utils';
import { Tab } from '../common/Tab';
import { VideoRecommendations } from './VideoRecommendations';
import { videoRecommendations } from '../../state/popup.queries';
import { Recommendation } from '@shared/models/Recommendation';

const logger = GetLogger('yt-video-recommendations');

const useStyles = makeStyles(() => ({
  appBar: {
    marginBottom: 20,
  },
  tab: {
    minWidth: 100,
  },
  displayNone: {
    display: 'none',
  },
}));

const CC_TAB_INDEX = 0;
const YT_TAB_INDEX = 1;
const HIDE_ALL_TAB_INDEX = 2;

export const YTVideoPage: React.FC<{
  node: HTMLDivElement;
  settings: Settings;
}> = ({ node, settings }) => {
  const { t } = useTranslation();
  const [currentTab, setCurrentTab] = React.useState(0);
  const [currentVideoId, setVideoId] = React.useState(
    getVideoId(window.location.href)
  );
  const [recommendations, setRecommendations] = React.useState<
    Recommendation[]
  >([]);
  const [recommendationsLoading, setRecommendationsLoading] =
    React.useState(false);

  const classes = useStyles();

  const patchYTRecommendations = (tab: number): void => {
    const displayNoneClassName = `+ ${classes.displayNone}`;
    const ytItemsRendererEl = document.getElementsByTagName(
      'ytd-watch-next-secondary-results-renderer'
    )[0];

    if (ytItemsRendererEl !== null && typeof ytItemsRendererEl === 'object') {
      if (tab === YT_TAB_INDEX) {
        ytItemsRendererEl.className = ytItemsRendererEl.className.replace(
          displayNoneClassName,
          ''
        );
      } else if (!ytItemsRendererEl.className.includes(displayNoneClassName)) {
        ytItemsRendererEl.className += displayNoneClassName;
      }
    }
  };

  const onTabChange = React.useCallback((tab: number) => {
    setCurrentTab(tab);
    patchYTRecommendations(tab);
  }, []);

  React.useEffect(() => {
    if (currentVideoId) {
      setRecommendationsLoading(true);
      void pipe(
        videoRecommendations.run({ videoId: currentVideoId }),
        // eslint-disable-next-line array-callback-return
        TE.map((recs) => {
          setRecommendationsLoading(false);
          setRecommendations(recs);
          if (currentTab !== HIDE_ALL_TAB_INDEX) {
            if (recs.length > 0) {
              onTabChange(CC_TAB_INDEX);
            } else {
              onTabChange(YT_TAB_INDEX);
            }
          }
        })
      )();
    }
  }, [currentVideoId]);

  React.useEffect(() => {
    patchYTRecommendations(currentTab);

    const observer = new MutationObserver(() => {
      const newVideoId = getVideoId(document.location.href);
      if (newVideoId !== currentVideoId) {
        logger.debug(
          'Video id changed from (%s) to (%s)',
          currentVideoId,
          newVideoId
        );
        setVideoId(newVideoId);
      }
    });

    observer.observe(document, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      patchYTRecommendations(YT_TAB_INDEX);
    };
  }, [currentVideoId]);

  React.useEffect(() => {
    if (!settings.active || !settings.enhanceYouTubeExperience) {
      patchYTRecommendations(YT_TAB_INDEX);
    } else {
      patchYTRecommendations(currentTab);
    }
  }, [currentTab, settings]);

  // do not show this component when extension is not `active` or `ux` is disabled
  const Portal =
    !settings.active || !settings.enhanceYouTubeExperience ? null : (
      <Box>
        <AppBar className={classes.appBar} position="static">
          <Tabs
            value={currentTab}
            onChange={(e, n) => onTabChange(n)}
            aria-label="recommendations tabs"
            variant="fullWidth"
            centered
          >
            <Tab
              className={classes.tab}
              icon={<ContentCreatorIcon />}
              wrapped={true}
              label={t('creator:title')}
              index={CC_TAB_INDEX}
            />
            <Tab
              className={classes.tab}
              icon={<YTIcon />}
              wrapped={true}
              label={t('youtube:title')}
              index={YT_TAB_INDEX}
            />
            <Tab
              className={classes.tab}
              icon={<HideIcon />}
              wrapped={true}
              label={t('hide_all:title')}
              index={HIDE_ALL_TAB_INDEX}
            />
          </Tabs>
        </AppBar>

        <TabPanel value={currentTab} index={CC_TAB_INDEX}>
          {currentVideoId === undefined ? (
            <Box>
              <FullSizeLoader />
            </Box>
          ) : (
            <VideoRecommendations
              recommendations={recommendations}
              loading={recommendationsLoading}
            />
          )}
        </TabPanel>
        <TabPanel value={currentTab} index={YT_TAB_INDEX}>
          <Typography variant="h4">{t('common:empty_string')}</Typography>
        </TabPanel>
      </Box>
    );

  return ReactDOM.createPortal(Portal, node);
};
