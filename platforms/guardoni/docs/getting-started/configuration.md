---
title: Configuration
sidebar_position: 2
---

All configurations needed by `guardoni` are stored in a `guardoni.config.json` file that will be created at the first run in  `~/.guardoni`

Here is the default configuration file

```typescript
{
  // The profile used by guardoni
  "profileName": "default",
   // Run in 'headless' mode
  "headless": false,
  "verbose": false,
  "loadFor": 3000,
   // YT platform config
  "yt": {
    "name": "youtube",
    // the backend where to send data
    "backend": "https://youtube.tracking.exposed/api",
    // the dir to load the extension from
    "extensionDir": "~/.guardoni/extension/yt"
  },
  "tk": {
    "name": "tiktok",
    // the backend where to send data
    "backend": "http://localhost:14000/api",
    // the dir to load the extension from
    "extensionDir": "~/.guardoni/extension/tk"
  },
  // the chrome executable path
  "chromePath": "/usr/bin/google-chrome"
}
```

When you use the [CLI](../cli/usage.md#configuration) you can override specific property.
