# YouChoose.AI

There are two components that compose this project.

1. The browser extension. the core product of YouChoose.AI, sponsored by Ledger project round 3
2. The backend of https://youtube.tracking.exposed, free software developed in 2018 under the ERC project ALEX (https://algorithms.exposed). This package since 2019 is maintained as an independent mechanism for Youtube algorithm accountability and enhanced to be the backend supporting YouChoose.

The backend in point 2 belongs to [an existing repository](https://github.com/tracking-exposed/yttrex) that we link via git submodule.

## Browser extension building

The extension building process would produces a `build/` directory.
It contains the browser extension for development as well as a the .zip file for the public.

### For developers and local testing

```
npm install
npm run build:dev
```

Or, tu run the compilation in continuous mode while developing:

```
npm run watch
```

At this point you can load it in your browser. Firefox and Chrome have slightly different action required.

To create a production build, run:

```
npm run build
```

**Chrome**:

1. Open a new Tab in `chrome://extensions`
2. Enable _developer mode_
3. click _load extension from file_
4. select the path `YouChoose/build`
5. Optionally you can pin the extension from the top bar menu

**Firefox**:

1. Navigate to `about:debugging`
2. Click `This Firefox`
3. Click `Load Temporary Add-on`
4. Select the `YouChoose/build/manifest.json` file

### Running the backend locally

#### Requirements

1. `docker` with `docker-compose` installed
2. Follow this initialization (submodule, dependency) from the YouChoose directory

```
git submodule init
git submodule update
cd yttrex-backend/backend
npm install
docker-compose up -d mongo
npm run watch
```

## API used by YouChoose

The API endpoints used by the YouChoose extension are automatically described in a dedicated page,
including a swagger user interface to test them, under the "Settings" tab within the extension.
