## How to build Trex documentation

do not run these commands from the workspace `docs`, but from the trex root project.

```
yarn yt:shared open-doc-api
yarn tk:shared open-doc-api
yarn ycai open-doc-api
```

```
yarn docs start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

### Build

```
$ yarn docs build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service. This is used in the server that deploy the documentation online.
