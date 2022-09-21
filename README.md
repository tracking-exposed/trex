# Tracking Exposed toolkit

This monorepo will eventually include all `packages` needed and `platforms` supported by `Tracking Exposed`:

## Commands

### unit test execution:

```
yarn
yarn test spec --coverage
```

1. It executes all the test files you can find with `find platforms/ -name '*.spec.ts`
2. Check the output in `coverage/lcov-report/index.html`

### To run end to end test:

```
yarn pm2 start platforms/ecosystem.config.js --env test
yarn test e2e
yarn pm2 stop all
```

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

## License

Affero-GPL 3, as file attached in this repository display.
