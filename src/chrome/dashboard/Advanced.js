import React from 'react';

class Advanced extends React.Component {
  render() {
    return (
      <div>
        <h3>TODO: <a href="https://swagger.io">swagger</a> for all these APIs</h3>
        <hr />
        <h2>Public API</h2>
        <ol>
          <li>
            <code>(youchoose.ai|localhost:9000)/api/v3/handshake</code>
          </li>

          <li>
            <code>
              (youchoose.ai|localhost:9000)/api/v3/video/:videoId/recommendations
            </code>
          </li>

          <li>
            <code>
              (youchoose.ai|localhost:9000)/api/v3/recommendations/:ids
            </code>
          </li>
        </ol>

        <h2>Creator (authenticated) API</h2>

        <ol>
          <li>
            <code>
              (youchoose.ai|localhost:9000)/api/v3/creator/updateVideo
            </code>
          </li>

          <li>
            <code>(youchoose.ai|localhost:9000)/api/v3/creator/ogp</code>
          </li>

          <li>
            <code>
              (youchoose.ai|localhost:9000)/api/v3/creator/videos/:publicKey
            </code>
          </li>

          <li>
            <code>
              (youchoose.ai|localhost:9000)/api/v3/creator/recommendations/:publicKey
            </code>
          </li>

          <li>
            <code>
              (youchoose.ai|localhost:9000)/api/v3/creator/register/:channelId
            </code>
          </li>
        </ol>

        <h2>Existing API from our previously developed backend</h2>

        <ol>
        <li><code>
(youtube.tracking.exposed|localhost:9000)/api/v2/compare/:videoId
        </code></li>

        <li><code>
(youtube.tracking.exposed|localhost:9000)/api/v2/related/:videoId
        </code></li>

        <li><code>
(youtube.tracking.exposed|localhost:9000)/api/v2/author/:videoId
        </code></li>

        <li><code>
(youtube.tracking.exposed|localhost:9000)/api/v2/searches/:queryString
        </code></li>
        </ol>

        <h2>API TODOs</h2>
        <ol>
        <li>Bling signature verification in creator/register API</li>
        <li>private key signature in all the creator APIs</li>
        <li>RESTful videos/recommendation</li>
        <li>Advertising (open data and query methods)</li>
        <li>Restore existing account (for dump/import your keyrings)</li>
        <li>Statistics on adoption, similar to <a href="https://youtube.tracking.exposed/impact">yttrex impact page</a>.</li>
        </ol>

        <p>Excluded from this list, but work in progress: shadowban analysis. At the moment it is developed as a separated tool/binary, and we're completing research. It is in alpha stage, and we can discuss more on the methodology.</p>
      </div>
    );
  }
}

export default Advanced;
