/* eslint-disable */
import './i18n';
import { ThemeProvider } from '@material-ui/styles';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { getVideoId } from './utils/yt.utils';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Recommendations } from './components/injected/VideoRecommendations';
import { YCAITheme } from './theme';

const ytRelatedVideoNode = document.querySelector('#related');
const ycRecommendations = document.querySelector('#yc-recommendations');

if (ytRelatedVideoNode !== null && ycRecommendations === null) {
  const ycMainNode = document.createElement('div');
  ycMainNode.id = 'yc-recommendations';
  ytRelatedVideoNode.prepend(ycMainNode);

  const videoId = getVideoId(window.location.href);

  ReactDOM.render(
    <React.StrictMode>
      <ErrorBoundary>
        <ThemeProvider theme={YCAITheme}>
          {videoId !== undefined ? (
            <div style={{ marginBottom: 40 }}>
              <Recommendations
                queries={{ videoRecommendations: { videoId } }}
              />
            </div>
          ) : (
            <div>Video not found</div>
          )}
        </ThemeProvider>
      </ErrorBoundary>
    </React.StrictMode>,
    document.getElementById('yc-recommendations')
  );
}
