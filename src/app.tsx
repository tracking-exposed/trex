import './i18n';
import { ThemeProvider } from '@material-ui/styles';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { YCAITheme } from './theme';
import { YTVideoPage } from './components/injected/YTVideoPage';

import './resources/global.css';

const ytRelatedVideoNode = document.querySelector('#related');
const ycRecommendations = document.querySelector('#yc-recommendations');

if (ytRelatedVideoNode !== null && ycRecommendations === null) {
  const ycMainNode = document.createElement('div');
  ycMainNode.id = 'yc-recommendations';
  ytRelatedVideoNode.prepend(ycMainNode);

  ReactDOM.render(
    <React.StrictMode>
      <ErrorBoundary>
        <ThemeProvider theme={YCAITheme}>
          <YTVideoPage />
        </ThemeProvider>
      </ErrorBoundary>
    </React.StrictMode>,
    document.getElementById('yc-recommendations')
  );
}
