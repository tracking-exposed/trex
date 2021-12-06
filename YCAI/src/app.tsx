import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import { Settings } from './models/Settings';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { YTContributionInfoBox } from './components/injected/YTContributionInfoBox';
import { YTVideoPage } from './components/injected/YTVideoPage';
import './i18n';
import * as Messages from './models/Messages';
import './resources/global.css';
import { settingsRefetch } from './state/popup.queries';
import { ThemeProvider, YCAITheme } from './theme';
import { bo } from './utils/browser.utils';
import { GetLogger } from '@shared/logger';

const appLogger = GetLogger('app');

const YT_RELATED_SELECTOR = '#secondary-inner';
const YC_RECOMMENDATIONS_ID = 'yc-recommendations';
const YC_RECOMMENDATIONS_SELECTOR = `#${YC_RECOMMENDATIONS_ID}`;
const YC_CONTRIBUTION_INFO_BOX_ID = 'ycai-contribution-box';

const InjectedApp: React.FC = () => {
  // nodes

  const [recommendationNode, setRecommendationNode] =
    React.useState<HTMLDivElement | null>(null);
  const [contributionInfoBoxNode, setContributionInfoNode] =
    React.useState<HTMLDivElement | null>(null);
  // state
  const [settings, setSettings] = React.useState<Settings | null>(null);

  const handleMessage = React.useCallback(
    <M extends Messages.MessageType<any, any, any>>(msg: M): void => {
      switch (msg.type) {
        case Messages.UpdateSettings.value: {
          return setSettings(msg.payload);
        }
        default:
          return undefined;
      }
    },
    [settings]
  );

  React.useEffect(() => {
    // for YTVideoPage
    const ytRelatedVideoNode = document.querySelector(YT_RELATED_SELECTOR);
    const ycRecommendationsNode =
      (ytRelatedVideoNode?.querySelector(
        YC_RECOMMENDATIONS_SELECTOR
      ) as HTMLDivElement | null) ?? null;

    // append yt video page recommendations dom element
    if (ytRelatedVideoNode !== null) {
      appLogger.debug('Element (%s) found in yt page', ytRelatedVideoNode.id);

      if (ycRecommendationsNode === null) {
        appLogger.debug(
          'Element (%s) not found in dom, attaching it..',
          YC_RECOMMENDATIONS_SELECTOR
        );
        const ycRelatedNode = document.createElement('div');
        ycRelatedNode.id = YC_RECOMMENDATIONS_ID;
        ytRelatedVideoNode.prepend(ycRelatedNode);
        setRecommendationNode(ycRelatedNode);
      }
      appLogger.debug(
        'Element (%s) present. Returning...',
        YC_RECOMMENDATIONS_SELECTOR
      );
    }

    // for YCVideoContributionInfoBox
    const ycContributionInfoBoxNode = document.getElementById(
      YC_CONTRIBUTION_INFO_BOX_ID
    ) as HTMLDivElement | null;

    // append yc contribution box
    if (ycContributionInfoBoxNode === null) {
      const contributionBoxEl = document.createElement('div');
      contributionBoxEl.id = YC_CONTRIBUTION_INFO_BOX_ID;
      contributionBoxEl.style.position = 'fixed';
      contributionBoxEl.style.width = '200px';
      contributionBoxEl.style.height = '30px';
      contributionBoxEl.style.right = '20px';
      contributionBoxEl.style.bottom = '20px';
      contributionBoxEl.style.padding = '4px';
      contributionBoxEl.style.zIndex = '9000';
      contributionBoxEl.style.borderRadius = '10px';
      document.body.appendChild(contributionBoxEl);

      setContributionInfoNode(ycContributionInfoBoxNode);
    }

    // register the on message listener
    bo.runtime.onMessage.addListener(
      <M extends Messages.MessageType<any, any, any>>(
        msg: M,
        sender: any,
        sendResponse: any
      ) => {
        appLogger.debug(`Message received %O from sender %O`, msg, sender);
        void handleMessage(msg);
        sendResponse(msg);
      }
    );

    // fetch settings on first time
    if (settings === null) {
      void pipe(
        settingsRefetch.run(),
        TE.map((settings) => setSettings(settings))
      )();
    }
  }, [recommendationNode, contributionInfoBoxNode]);

  return (
    <ErrorBoundary>
      <ThemeProvider theme={YCAITheme}>
        {contributionInfoBoxNode !== null && settings !== null && (
          <YTContributionInfoBox
            node={contributionInfoBoxNode}
            settings={settings}
          />
        )}
        {recommendationNode !== null && settings !== null && (
          <YTVideoPage settings={settings} node={recommendationNode} />
        )}
      </ThemeProvider>
    </ErrorBoundary>
  );
};

const YC_ROOT_ID = 'yc-root-injected';

const observer = new MutationObserver(() => {
  const ycRoot = document.createElement('div');
  ycRoot.id = YC_ROOT_ID;
  ycRoot.style.position = 'absolute';
  ycRoot.style.width = '0';
  document.body.appendChild(ycRoot);

  ReactDOM.render(
    <React.StrictMode>
      <InjectedApp />
    </React.StrictMode>,
    ycRoot
  );

  observer.disconnect();
});

observer.observe(document, { childList: true, subtree: true });
