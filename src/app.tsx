import './i18n';
import './resources/global.css';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import { debounce } from 'lodash';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { settingsRefetch } from 'state/public.queries';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { YTContributionInfoBox } from './components/injected/YTContributionInfoBox';
import { YTVideoPage } from './components/injected/YTVideoPage';
import * as Messages from './models/Messages';
import { ThemeProvider, YCAITheme } from './theme';
import { bo } from './utils/browser.utils';
import { GetLogger } from './utils/logger.utils';
import { Settings } from './models/Settings';
import { refreshSettings } from './state/public.commands';
const appLogger = GetLogger('app');

const YT_RELATED_SELECTOR = '#related';
const YC_RECOMMENDATIONS_ID = 'yc-recommendations';
const YC_RECOMMENDATIONS_SELECTOR = `#${YC_RECOMMENDATIONS_ID}`;
const YC_CONTRIBUTION_INFO_BOX_ID = 'ycai-contribution-box';
const YC_CONTRIBUTION_INFO_BOX_SELECTOR = `#${YC_CONTRIBUTION_INFO_BOX_ID}`;

const renderInjectedElements = (settings: Settings | null): void => {
  appLogger.debug('Settings refreshed %O', settings);
  const ytRelatedVideoNode = document.querySelector(YT_RELATED_SELECTOR);

  if (document.querySelector(YC_CONTRIBUTION_INFO_BOX_SELECTOR) === null) {
    const contributionBoxEl = document.createElement('div');
    contributionBoxEl.id = YC_CONTRIBUTION_INFO_BOX_ID;
    contributionBoxEl.style.position = 'fixed';
    contributionBoxEl.style.width = '120px';
    contributionBoxEl.style.textAlign = 'right';
    contributionBoxEl.style.height = '50px';
    contributionBoxEl.style.right = '20px';
    contributionBoxEl.style.bottom = '20px';
    contributionBoxEl.style.padding = '4px';
    contributionBoxEl.style.zIndex = '9000';
    contributionBoxEl.style.borderRadius = '10px';

    document.body.appendChild(contributionBoxEl);

    ReactDOM.render(
      <React.StrictMode>
        <ErrorBoundary>
          <ThemeProvider theme={YCAITheme}>
            <YTContributionInfoBox />
          </ThemeProvider>
        </ErrorBoundary>
      </React.StrictMode>,
      document.getElementById('ycai-contribution-box')
    );
  }

  // video recommendations box
  if (settings?.enhanceYouTubeExperience === true) {
    if (ytRelatedVideoNode !== null) {
      appLogger.debug('Element (%s) found in yt page', ytRelatedVideoNode.id);
      const ycRecommendationsEl = ytRelatedVideoNode.querySelector(
        YC_RECOMMENDATIONS_SELECTOR
      );

      if (ycRecommendationsEl !== null) {
        appLogger.debug(
          'Element (%s) present. Returning...',
          YC_RECOMMENDATIONS_SELECTOR
        );
        return undefined;
      }

      appLogger.debug(
        'Element (%s) not found in dom, attaching it..',
        YC_RECOMMENDATIONS_SELECTOR
      );
      const ycMainNode = document.createElement('div');
      ycMainNode.id = YC_RECOMMENDATIONS_ID;
      ytRelatedVideoNode.prepend(ycMainNode);

      ReactDOM.render(
        <React.StrictMode>
          <ErrorBoundary>
            <ThemeProvider theme={YCAITheme}>
              <YTVideoPage />
            </ThemeProvider>
          </ErrorBoundary>
        </React.StrictMode>,
        document.getElementById(YC_RECOMMENDATIONS_ID)
      );
    }
  } else {
    appLogger.debug('Removing element (%s)', YC_RECOMMENDATIONS_SELECTOR);
    document.querySelector(YC_RECOMMENDATIONS_SELECTOR)?.remove();
    document.querySelector(YC_CONTRIBUTION_INFO_BOX_SELECTOR)?.remove();
  }
  return undefined;
};

/**
 * Define mutation observer to listen for window's dom changes
 */
void pipe(
  settingsRefetch.run(),
  TE.map((settings) => {
    if (settings.active) {
      if (settings.independentContributions.enable) {
        appLogger.debug(
          'Independent contribution enabled. Getting the keypair...'
        );

        const observer = new MutationObserver(
          debounce(
            (mutations) => {
              appLogger.debug(`Mutations received %O`, mutations);
              renderInjectedElements(settings);
            },
            2500,
            // NOTE: 2500ms to collect evidence as
            // don't need that much frequency.
            { trailing: true }
          )
        );

        observer.observe(window.document.body, {
          subtree: true,
          childList: true,
        });

        window.addEventListener('unload', () => {
          observer.disconnect();
        });
      }
    }

    return undefined;
  })
)();

const handleMessage = <M extends Messages.MessageType<any, any, any>>(
  msg: M
): TE.TaskEither<chrome.runtime.LastError, void> => {
  switch (msg.type) {
    case Messages.UpdateSettings.value: {
      return pipe(
        refreshSettings({}),
        TE.chain(() => TE.right(renderInjectedElements(msg.payload)))
      );
    }
    default:
      return TE.right(undefined);
  }
};

bo.runtime.onMessage.addListener(
  <M extends Messages.MessageType<any, any, any>>(
    msg: M,
    sender: any,
    sendResponse: any
  ) => {
    appLogger.debug(`Message received %O from sender %O`, msg, sender);
    void handleMessage(msg)();
    sendResponse(msg);
  }
);

// fetch settings and render video recommendations box
void pipe(
  settingsRefetch.run(),
  TE.map((settings) => renderInjectedElements(settings))
)();
