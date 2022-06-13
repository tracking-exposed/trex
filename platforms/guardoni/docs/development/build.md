---
title: Build
---

## Development

Building `guardoni` for development requires to build the extensions first. This can be done by running:

```bash
export NODE_ENV=development
yarn yt:ext build
yarn tk:ext build
```

Then guardoni can be built with:

```bash
yarn guardoni build
```

When the build process is finished, the `CLI` can be run with `-c` option pointing to the `guardoni.config.json` located as `platforms/guardoni`:

```bash
yarn guardoni cli --basePath ./ -c guardoni.config.json yt-navigate
```
