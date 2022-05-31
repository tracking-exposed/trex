---
title: Packaging
---

The `guardoni` tool can be packaged easily after has been properly [`built`](./build.md), by runnung:

```sh
NODE_ENV=development yarn guardoni pkg
```

This will produce executables for `Windows`, `MacOS` and `Linux` inside the `platforms/guardoni/dist` folder.
