---
sidebar_position: 3
title: Backend
id: backend
---

import CodeBlock from '@theme/CodeBlock';

**Build the backend for development:**

- Start the mongoDB container:
  <CodeBlock className="language-bash">
  docker-compose up -d mongodb
  </CodeBlock>

- Start the mongo-indexes container:
  <CodeBlock className="language-bash">
  docker-compose up -d mongo-yt-indexes
  </CodeBlock>
- Start the backend:
  <CodeBlock className="language-bash">
  yarn pm2 start platforms/yttrex/backend/ecosystem.dev.config.js
  </CodeBlock>

- [Optional] Set the watcher for the logs:
  <CodeBlock className="language-bash">
  yarn pm2 logs yt:backend:watch
  </CodeBlock>
