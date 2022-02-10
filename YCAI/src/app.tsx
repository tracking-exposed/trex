import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { ThemeProvider } from '@material-ui/styles';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';

import { GetLogger } from '@trex/shared/logger';
import debug from 'debug';

import { config } from './config';
import * as Messages from './models/Messages';
import { bo } from './utils/browser.utils';
import { settingsRefetch } from './state/popup.queries';
import { Settings } from './models/Settings';
import { YTContributionInfoBox } from './components/injected/YTContributionInfoBox';
import { YTVideoPage } from './components/injected/YTVideoPage';
import { ErrorBoundary } from '@trex/shared/components/Error/ErrorBoundary';
import { YCAITheme } from './theme';
import './i18n';

import './resources/global.css';

const YT_RECOMMENDATIONS_SELECTOR = 'ytd-watch-next-secondary-results-renderer';
const YC_ROOT_ID = 'yc-root-injected';

debug.enable(config.DEBUG);
const { debug: log } = GetLogger('app');

const InjectedApp: React.FC = () => {
  const [settings, setSettings] = useState<Settings | null>(null);

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

  useEffect(() => {
    if (settings === null) {
      void pipe(
        settingsRefetch.run(),
        TE.map((settings) => setSettings(settings))
      )();
    }

    bo.runtime.onMessage.addListener(
      <M extends Messages.MessageType<any, any, any>>(
        msg: M,
        sender: any,
        sendResponse: any
      ) => {
        log(`Message received %O from sender %O`, msg, sender);
        void handleMessage(msg);
        sendResponse(msg);
      }
    );
  }, []);

  if (settings === null || !settings.enhanceYouTubeExperience) {
    return null;
  }

  return (
    <React.StrictMode>
      <ErrorBoundary>
        <ThemeProvider theme={YCAITheme}>
          <YTVideoPage
            settings={settings}
            ytRecommendationsSelector={YT_RECOMMENDATIONS_SELECTOR}
          />
        </ThemeProvider>
        <YTContributionInfoBox settings={settings} />
      </ErrorBoundary>
    </React.StrictMode>
  );
};

const observer = new MutationObserver(() => {
  const ytRecommendations = document.querySelector(YT_RECOMMENDATIONS_SELECTOR);
  const ycai = document.getElementById(YC_ROOT_ID);
  if (ytRecommendations && !ycai) {
    const ycRoot = document.createElement('div');
    ycRoot.id = YC_ROOT_ID;
    if (ytRecommendations.parentNode) {
      ytRecommendations.parentNode.insertBefore(ycRoot, ytRecommendations);
      ReactDOM.render(<InjectedApp />, ycRoot);
    }
  }
});

observer.observe(document, {
  childList: true,
  subtree: true,
});
