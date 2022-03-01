---
title: Installation
---

## Getting started

By default guardoni downloads an extension version `.99` with default opt-in (meant for automation) already built and places it in `$basePath/extension` folder.
By default this extension sends the results to the server.

To get an extension which sends the results to the local server you have to build it yourself - as explained in details in the [extension project](../extension/README.md):

```bash
# from the project's root
cd ../extension
yarn build
```

Once you build the extension you need to compile `guardoni` code too:

```bash
yarn build
```

Then you'll be able to execute both [cli](#cli) and [electron](#electron) programs.
