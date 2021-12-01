import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { settingsRefetch } from 'state/public.queries';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { YTContributionInfoBox } from './components/injected/YTContributionInfoBox';
import { YTVideoPage } from './components/injected/YTVideoPage';
import './i18n';
import * as Messages from './models/Messages';
import './resources/global.css';
import { ThemeProvider, YCAITheme } from './theme';
import { bo } from './utils/browser.utils';
import { GetLogger } from './utils/logger.utils';
import * as TE from 'fp-ts/lib/TaskEither';
import { pipe } from 'fp-ts/lib/function';
import { Settings } from 'models/Settings';

const appLogger = GetLogger('app');

const YT_RELATED_SELECTOR = '#related';
const YC_RECOMMENDATIONS_ID = 'yc-recommendations';
const YC_RECOMMENDATIONS_SELECTOR = `#${YC_RECOMMENDATIONS_ID}`;
const YC_CONTRIBUTION_INFO_BOX_ID = 'ycai-contribution-box';

const InjectedApp: React.FC = () => {
  // nodes
  // for YTVideoPage
  const ytRelatedVideoNode = document.querySelector(YT_RELATED_SELECTOR);
  const ycRecommendationsNode =
    (ytRelatedVideoNode?.querySelector(
      YC_RECOMMENDATIONS_SELECTOR
    ) as HTMLDivElement | null) ?? null;

  // for YCVideoContributionInfoBox
  const ycContributionInfoBoxNode = document.getElementById(
    YC_CONTRIBUTION_INFO_BOX_ID
  ) as HTMLDivElement | null;

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
      }
      appLogger.debug(
        'Element (%s) present. Returning...',
        YC_RECOMMENDATIONS_SELECTOR
      );
    }

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
  }, [ycRecommendationsNode, ycContributionInfoBoxNode]);


  return (
    <ErrorBoundary>
      <ThemeProvider theme={YCAITheme}>
        {ycContributionInfoBoxNode !== null && settings !== null && (
          <YTContributionInfoBox
            node={ycContributionInfoBoxNode}
            settings={settings}
          />
        )}
        {ycRecommendationsNode !== null && settings !== null && (
          <YTVideoPage settings={settings} node={ycRecommendationsNode} />
        )}
      </ThemeProvider>
    </ErrorBoundary>
  );
};

const YC_ROOT_ID = 'yc-root-injected';

const ycRootNode = document.querySelector(`#${YC_ROOT_ID}`);
if (ycRootNode === null) {
  const ycRoot = document.createElement('div');
  ycRoot.id = YC_ROOT_ID;
  ycRoot.style.position = 'absolute';
  ycRoot.style.width = "0";
  document.body.appendChild(ycRoot);

  ReactDOM.render(
    <React.StrictMode>
      <InjectedApp />
    </React.StrictMode>,
    ycRoot
  );
}
