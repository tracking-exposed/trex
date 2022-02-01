import React from 'react';
import { AppBar, Box, Tabs, Typography } from '@material-ui/core';
import HideIcon from '@material-ui/icons/VisibilityOffOutlined';
import YTIcon from '@material-ui/icons/YouTube';
import { makeStyles } from '@material-ui/styles';
import * as TE from 'fp-ts/lib/TaskEither';
import { pipe } from 'fp-ts/lib/function';
import { useTranslation } from 'react-i18next';

import { getVideoId } from '../../utils/yt.utils';
import { videoRecommendations } from '../../state/popup.queries';
import { FullSizeLoader } from '../common/FullSizeLoader';
import { GetLogger } from '@shared/logger';
import { Recommendation } from '@shared/models/Recommendation';
import { Settings } from '../../models/Settings';
import { TabPanel } from '../common/TabPanel';
import { Tab } from '../common/Tab';
import { VideoRecommendations } from './VideoRecommendations';
import DonationOptInNudger from './DonationOptInNudger';
import { YCAITheme } from '../../theme';
import ccIconSrc from '../../resources/youchoose-icon.svg';

const logger = GetLogger('yt-video-recommendations');

const useStyles = makeStyles<YCAITheme>((theme) => ({
  appBar: {
    marginBottom: 20,
    borderRadius: '8px',
  },
  tab: {
    minWidth: 100,
  },
  text: {
    color: theme.palette.grey[400],
    fontSize: '1.4rem',
    textAlign: 'center',
  },
}));

const CC_TAB_INDEX = 0;
const YT_TAB_INDEX = 1;
const HIDE_ALL_TAB_INDEX = 2;

export const YTVideoPage: React.FC<{
  ytRecommendationsSelector: string;
  settings: Settings;
}> = ({ ytRecommendationsSelector, settings }) => {
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
    const ytNode: HTMLElement | null = document.querySelector(
      ytRecommendationsSelector
    );

    if (ytNode) {
      if (tab === YT_TAB_INDEX) {
        const { previousDisplayStyle } = ytNode.dataset;
        if (previousDisplayStyle) {
          ytNode.style.display = previousDisplayStyle;
        }
      } else {
        const { display } = window.getComputedStyle(ytNode);
        if (display !== 'none') {
          ytNode.dataset.previousDisplayStyle =
            window.getComputedStyle(ytNode).display;
          ytNode.style.display = 'none';
        }
      }
    }
  };

  const onTabChange = React.useCallback((tab: number) => {
    setCurrentTab(tab);
    patchYTRecommendations(tab);
  }, []);

  React.useEffect(() => {
    if (currentVideoId) {
      let channelId: string | undefined;

      const channelLink = document.querySelector('#channel-name a');
      if (channelLink) {
        const m = channelLink
          .getAttribute('href')
          ?.match(/\/channel\/([^/]+)\/?/);
        if (m) {
          channelId = m[1];
        }
      }

      setRecommendationsLoading(true);
      void pipe(
        videoRecommendations.run({
          channelId,
          videoId: currentVideoId,
        }),
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
    if (!settings.enhanceYouTubeExperience) {
      patchYTRecommendations(YT_TAB_INDEX);
    } else {
      patchYTRecommendations(currentTab);
    }
  }, [currentTab, settings]);

  return (
    <Box mb={4} style={{ borderRadius: '8px' }}>
      <AppBar className={classes.appBar} position="static">
        <Tabs
          value={currentTab}
          onChange={(e, n) => onTabChange(n)}
          aria-label="recommendations tabs"
          variant="fullWidth"
          centered
          style={{
            borderRadius: '8px',
          }}
        >
          <Tab
            className={classes.tab}
            icon={<img src={ccIconSrc} style={{ width: 17 }} />}
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

      <DonationOptInNudger />

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
      <TabPanel value={currentTab} index={HIDE_ALL_TAB_INDEX}>
        <Typography variant="h5" className={classes.text}>
          {t('ytVideoPage:distractionFree')}
        </Typography>
      </TabPanel>
    </Box>
  );
};
