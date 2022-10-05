# Tracking Exposed toolkit

![](https://github.com/tracking-exposed/trex/actions/workflows/master_release.yml/badge.svg)
![](https://img.shields.io/github/v/release/tracking-exposed/trex)

This monorepo will eventually include all `packages` needed and `platforms` supported by `Tracking Exposed`:

## Requirements

- `node >=16`
- `yarn >=3.2.3`
- [node-canvas](https://github.com/Automattic/node-canvas) deps depending on your OS

## Monorepo structure

- packages
  - [shared](./packages/shared/README.md)
  - [taboule](./packages/taboule/README.md)
- platforms
  - Youtube
    - [yt:shared](./platforms/yttrex/shared/README.md)
    - [yt:ext](./platforms/yttrex/extension/README.md)
    - [yt:backend](./platforms/yttrex/backend/README.md)
  - TikTok
    - [tk:shared](./platforms/tktrex/shared/README.md)
    - [tk:ext](./platforms/tktrex/extension/README.md)
    - [tk:backend](./platforms/tktrex/backend/README.md)


### To start the services in production:

```
yarn pm2 start platforms/ecosystem.config.js
yarn pm2 status
```

### (also for extension reviewer) how to build the extensions:

- tiktok: `yarn; yarn tk:ext dist; ls platforms/tktrex/extension/dist/*.zip`
- youtube: `yarn; yarn yt:ext dist; ls platforms/yttrex/extension/dist/*.zip`
- youchoose: `yarn; yarn ycai dist; ls platforms/ycai/studio/build/extension/*.zip`

### To assist debug

you might run `yarn tsc-diagnostics` and check out the content of `diagnostics/` directory.

## Supported Platforms

### [tktrex](./platforms/tktrex)

The browser extension of [tiktok.tracking.exposed](https://tiktok.tracking.exposed) the tiktok algorithm analysis toolkit for researcher, power user, and algorithm analysts.

### [yttrex](./platforms/yttrex)

The browser extension of [youtube.tracking.exposed](https://youtube.tracking.exposed) the youtube algorithm analysis toolkit for researcher, power user, and algorithm analysts.

Initially sponsored by [ALEX](https://algorithms.exposed) from University of Amsterdam DATACTIVE reseaerch group.
Maintained by the Technical team of [Tracking Exposed](https://tracking.exposed), more details on [youtube.tracking.exposed](https://youtube.tracking.exposed).

### [Guardoni](./platforms/guardoni/)

A complete Pupetteer wrapper to orchestrate reproducible data collection with YTTrEx extension, documented with the name of [Guardoni](https://youtube.tracking.exposed/guardoni)

Maintained by the Technical and Research team of [Tracking Exposed](https://tracking.exposed), more details on [youtube.tracking.exposed](https://youtube.tracking.exposed).

### [YCAI](./platforms/ycai/studio/)

The browser extension for [YouChoose.AI](https://youchoose.ai) and studio dashboard [studio.youchoose.ai](https://studio.youchoose.ai)

Sponsored by the European Commission Ledger project in 2021, Develope by the technical team of [YouChoose AI](https://youchoose.ai) a project by Tracking Exposed. It is listed separately as we **consider YouChoose should develop its own governance**, reach out to us if you want to know more.

## Note on supported platforms

As you can see in [Tracking Exposed](https://tracking.exposed) website a few other platforms are supported, work in progress, or discontinued. For example: Pornhub, Facebook, Amazon. They are not imported in this repository, but making this repository a shared resource and a monorepo is part of the refactor begun in 2021.

## Packages

### [Taboule](./packages/taboule/)

A portable data table written in React to display TRex data by pre-configured API.

## Tests

Tests are powered by `jest` and can be run all at once

```bash
yarn test
```

or by specific workspace

```bash
yarn yt:ext test
```

### Run spec tests

To execute all the `spec` (unit testing) test files in the repo run:

```bash
yarn test spec --coverage
```

### Run end-to-end tests

```bash
yarn pm2 start platforms/ecosystem.dev.config.js --env test
yarn test e2e
yarn pm2 stop all
```

### Coverage output

To produce a _coverage_ report run

```bash
yarn test --coverage
```

and the output will be produced at `coverage/lcov-report/index.html`

## License

Affero-GPL 3, as file attached in this repository display.
