import React from 'react';

class Advanced extends React.Component {
  render () {
    return (
      <div>
        <h4>Public API</h4>
        <ol>
        <li><code>
(youchoose.ai|localhost:9000)/api/v3/handshake
        </code></li>

        <li><code>
(youchoose.ai|localhost:9000)/api/v3/video/:videoId/recommendations
        </code></li>

        <li><code>
(youchoose.ai|localhost:9000)/api/v3/recommendations/:ids
        </code></li>
        </ol>

        <h4>Creator authenticated API</h4>

        <ol>
        <li><code>
(youchoose.ai|localhost:9000)/api/v3/creator/updateVideo
        </code></li>

        <li><code>
(youchoose.ai|localhost:9000)/api/v3/creator/ogp
        </code></li>

        <li><code>
(youchoose.ai|localhost:9000)/api/v3/creator/videos/:publicKey
        </code></li>

        <li><code>
(youchoose.ai|localhost:9000)/api/v3/creator/recommendations/:publicKey
        </code></li>

        <li><code>
(youchoose.ai|localhost:9000)/api/v3/creator/register/:channelId
        </code></li>
        </ol>

      </div>
    );
  }
}

export default Advanced;
