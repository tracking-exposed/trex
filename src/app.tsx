import './i18n';
import { ThemeProvider } from '@material-ui/styles';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { YCAITheme } from './theme';
import { YTVideoPage } from './components/injected/YTVideoPage';
import './resources/global.css';
import { GetLogger } from './utils/logger.utils';
import { debounce } from 'lodash';

const appLogger = GetLogger('app');

const YC_RECOMMENDATIONS_ID = 'yc-recommendations';

const renderVideoRecommendationsBox = (): void => {

  const ytRelatedVideoNode = document.querySelector('#related');
  if (ytRelatedVideoNode !== null) {
    appLogger.debug('Element (%s) found in yt page', ytRelatedVideoNode.id);
    const ycRecommendationsEl = ytRelatedVideoNode.querySelector(
      `#${YC_RECOMMENDATIONS_ID}`
    );

    if (ycRecommendationsEl !== null) {
      appLogger.debug(
        'Element (%s) present. Returning...',
        `#${YC_RECOMMENDATIONS_ID}`
      );
      return;
    }

    appLogger.debug(
      'Element (%s) not found in dom, attaching it..',
      `#${YC_RECOMMENDATIONS_ID}`
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
