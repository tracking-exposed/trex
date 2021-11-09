import './i18n';
import './resources/global.css';
import { ThemeProvider } from '@material-ui/styles';
import { pipe } from 'fp-ts/lib/pipeable';
import { debounce } from 'lodash';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { settingsRefetch } from 'state/public.queries';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { YTVideoPage } from './components/injected/YTVideoPage';
import { YCAITheme } from './theme';
import { GetLogger } from './utils/logger.utils';
import * as TE from 'fp-ts/lib/TaskEither';

const appLogger = GetLogger('app');

const YT_RELATED_SELECTOR = '#related';
const YC_RECOMMENDATIONS_ID = 'yc-recommendations';
const YC_RECOMMENDATIONS_SELECTOR = `#${YC_RECOMMENDATIONS_ID}`;

const renderVideoRecommendationsBox = (): void => {
  void pipe(
    settingsRefetch.run(),
    TE.map((settings) => {
      appLogger.debug('Settings refreshed %O', settings);
      const ytRelatedVideoNode = document.querySelector(YT_RELATED_SELECTOR);

      if (settings.active && settings.ccRecommendations) {
        appLogger.debug('Settings: active');
        if (ytRelatedVideoNode !== null) {
          appLogger.debug(
            'Element (%s) found in yt page',
            ytRelatedVideoNode.id
          );
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
        } else {
          appLogger.debug('Removing element (%s)', YC_RECOMMENDATIONS_SELECTOR);
          document.querySelector(YC_RECOMMENDATIONS_SELECTOR)?.remove();
        }
      }
      return undefined;
    })
  )();
};

/**
 * Define mutation observer to listen for window's dom changes
 */
const observer = new MutationObserver(
  debounce(
    (mutations) => {
      appLogger.debug(`Mutations received %O`, mutations);
      renderVideoRecommendationsBox();
    },
    500,
    { trailing: true }
  )
);

observer.observe(window.document.body, {
  subtree: true,
  childList: true,
});

// render video recommendations box
renderVideoRecommendationsBox();
