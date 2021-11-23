# YouChoose.AI

There are three components that compose this project.

1. The browser extension. the core product of YouChoose.AI, sponsored by Ledger project round 3
2. The backend of https://youtube.tracking.exposed, free software developed in 2018 under the ERC project ALEX (https://algorithms.exposed). This package since 2019 is maintained as an independent mechanism for Youtube algorithm accountability and enhanced to be the backend supporting YouChoose.
3. The website https://youchoose.ai, is available at the address [TODO Ledgercommit]

The backend in point 2 belongs to an existing repository that we link via git submodule.

### Browser extension building

The extension building process would produce directory `build/` or `dist/`. The first contains the output for development and local execution, and the second creates the .zip for the public.

##### for developers and local testing.

```
npm install
npm run build
```

it should produce an output like this:

```
$ npm run build

> youchoose.ai@0.1.2 build C:\Users\Claudio\VMShared\YCAI
> rm -rf ./build && mkdir build && cross-env webpack && cp -r src/popup/* manifest.json icons/* ./build/

NODE_ENV [undefined] Prod: false Devel:  true
Development, using as environment variables: {"DEVELOPMENT":"true","NODE_ENV":"\"development\"","API_ROOT":"\"http://localhost:9000/api/v3\"","WEB_ROOT":"\"http://localhost:1313\"","VERSION":"\"0.1.2-dev\"","BUILD":"\"On the 08 of September pmt 14:36.\"","BUILDISODATE":"\"2021-09-08T12:36:50.782Z\"","FLUSH_INTERVAL":"10000"}
Hash: cc4a9623ff47580332a5
Version: webpack 2.1.0-beta.17
Time: 8278ms
        Asset     Size  Chunks             Chunk Names
     popup.js  11.7 MB       0  [emitted]  popup
 dashboard.js  9.39 MB       1  [emitted]  dashboard
       app.js     4 MB       2  [emitted]  app
background.js  2.48 MB       3  [emitted]  background
    + 825 hidden modules
```

At this point you should load it in your browser. Firefox and Chrome have slightly different action required.

**Chrome**:

1. Open a new Tab in `chrome://extensions`
2. Enable _developer mode_
3. click _load extension from file_
4. select the path `YouChoose/build`, what's matter for the browser is to find the manifest.json
5. Optionally you can pin the extension from the top bar menu

##### for reproducible build

We publish the extension in Firefox and Chrome store, but in case you want to verify the building process, please be sure to point at the signed release

```
npm install
npm run build:dist
```

This should produce a similar output:

```
$ npm run build:dist

> youchoose.ai@0.1.2 build:dist C:\Users\Claudio\VMShared\YCAI
> sh pack-extension.sh

NODE_ENV [production] Prod: true Devel:  false
Hash: 98380f83191be2ce6b0f
Version: webpack 2.1.0-beta.17
Time: 22884ms
        Asset     Size  Chunks             Chunk Names
     popup.js  1.18 MB       0  [emitted]  popup
 dashboard.js   847 kB       1  [emitted]  dashboard
       app.js   432 kB       2  [emitted]  app
background.js   206 kB       3  [emitted]  background
    + 819 hidden modules
Manually removing 'localhost:14000 and localhost' from the manifest.json
  adding: app.js (164 bytes security) (deflated 71%)
  adding: background.js (164 bytes security) (deflated 65%)
  adding: dashboard.html (164 bytes security) (deflated 35%)
  adding: dashboard.js (164 bytes security) (deflated 74%)
  adding: font.css (164 bytes security) (deflated 21%)
  adding: manifest.json (164 bytes security) (deflated 54%)
  adding: popup.html (164 bytes security) (deflated 35%)
  adding: popup.js (164 bytes security) (deflated 74%)
  adding: Trex-Regular.ttf (164 bytes security) (deflated 58%)
  adding: ycai128.png (164 bytes security) (deflated 1%)
  adding: ycai16.png (164 bytes security) (stored 0%)
  adding: ycai48.png (164 bytes security) (stored 0%)
  adding: ycai64.png (164 bytes security) (stored 0%)
  adding: ycai-logo.png (164 bytes security) (deflated 0%)
  adding: youchoose-ux.css (164 bytes security) (deflated 70%)

$ ls -l dist/extension.zip
-rw-r--r-- 1 Claudio 197609 799394 Sep  8 14:49 dist/extension.zip
```

### Run the backend locally

We guarantee this process on Linux Debian based distribution.  

##### Requirements

1. Mongodb running locally, the config file `yttrex-backend/backend/config/settings.json` specify a few settings such as DB name, port, and collection names. Minimum version of MongoDB is 3.x
2. Follow this initialization (submodule, dependency) from the YouChoose directory

```
git submodule init
git submodule update
cd yttrex-backend/backend
npm install
npm run watch
```

# API used by YouChoose

This would be documented in details in a dedicate space. By the 8 September 2021 alpha stage, [here implemented](https://github.com/tracking-exposed/yttrex/blob/master/backend/routes/youchoose.js).


### Public 

POST /api/v3/handshake
GET /api/v3/video/:videoId/recommendations
GET /api/v3/recommendations/:ids

### Content Creator 

POST /api/v3/creator/updateVideo
GET /api/v3/creator/ogp/:url
GET /api/v3/creator/videos/:publicKey
GET /api/v3/creator/recommendations/:publicKey
