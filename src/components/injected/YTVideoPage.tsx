import { AppBar, Box, Tabs, Typography } from '@material-ui/core';
import CommunityIcon from '@material-ui/icons/GroupWorkOutlined';
import ContentCreatorIcon from '@material-ui/icons/HealingOutlined';
import YTIcon from '@material-ui/icons/YouTube';
import { makeStyles } from '@material-ui/styles';
import * as QR from 'avenger/lib/QueryResult';
import { WithQueries } from 'avenger/lib/react';
import { ErrorBox } from 'components/common/ErrorBox';
import {
  FullSizeLoader,
  LazyFullSizeLoader,
} from 'components/common/FullSizeLoader';
import { TabPanel } from 'components/common/TabPanel';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { settingsRefetch } from 'state/public.queries';
import { GetLogger } from 'utils/logger.utils';
import { getVideoId } from 'utils/yt.utils';
import { Tab } from '../common/Tab';
import { VideoRecommendations } from './VideoRecommendations';

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

export const YTVideoPage: React.FC = () => {
  return (
    <WithQueries
      queries={{ settings: settingsRefetch }}
      render={QR.fold(LazyFullSizeLoader, ErrorBox, ({ settings }) => {
        const { t } = useTranslation();
        const [currentTab, setCurrentTab] = React.useState(0);
        const [currentVideoId, setVideoId] = React.useState(
          getVideoId(window.location.href)
        );

        const classes = useStyles();

        const patchYTRecommendations = (tab: number): void => {
          const displayNoneClassName = `+ ${classes.displayNone}`;
          const ytItemsRendererEl = document.getElementsByTagName(
            'ytd-watch-next-secondary-results-renderer'
          )[0];

          if (
            ytItemsRendererEl !== null &&
            typeof ytItemsRendererEl === 'object'
          ) {
            // tab n2 = youtube, tab1 = community
            if (tab === 2) {
              ytItemsRendererEl.className = ytItemsRendererEl.className.replace(
                displayNoneClassName,
                ''
              );
            } else if (
              !ytItemsRendererEl.className.includes(displayNoneClassName)
            ) {
              ytItemsRendererEl.className += displayNoneClassName;
            }
          }
        };

        const onTabChange = React.useCallback(
          (tab: number) => {
            setCurrentTab(tab);
            patchYTRecommendations(tab);
          },
          []
        );

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
          };
        }, [currentVideoId]);

        React.useEffect(() => {
          if (!settings.active || !settings.ccRecommendations) {
            patchYTRecommendations(2);
          }
        }, [settings]);

        // do not show this component when extension is not `active` or `ux` is disabled
        if (!settings.active || !settings.ccRecommendations) {
          return null;
        }

        return (
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
                  index={0}
                />
                <Tab
                  className={classes.tab}
                  icon={<CommunityIcon />}
                  wrapped={true}
                  label={t('hide_all:title')}
                  index={1}
                />
                <Tab
                  className={classes.tab}
                  icon={<YTIcon />}
                  wrapped={true}
                  label={t('youtube:title')}
                  index={2}
                />
              </Tabs>
            </AppBar>

            <TabPanel value={currentTab} index={0}>
              {currentVideoId === undefined ? (
                <Box>
                  <FullSizeLoader />
                </Box>
              ) : (
                <VideoRecommendations
                  queries={{
                    videoRecommendations: { videoId: currentVideoId },
                  }}
                />
              )}
            </TabPanel>
            <TabPanel value={currentTab} index={1}>
              <Typography variant="h4">{t('common:coming_soon')}</Typography>
            </TabPanel>
          </Box>
        );
      })}
    />
  );
};
