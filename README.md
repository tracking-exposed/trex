# YouChoose.AI

### How to build:

```
npm install
cd yttrex-backend/

# install submodule (youtube trex dependency)
git submodule init
git submodule update
cd backend

# install the yttrex server 
npm install
cd ../..
npm run build

# to run the server
cd yttrex-backend/backend
npm run watch

# then load the developer extension in Chrome
go to chrome://extensions
enable developer mode
click 'load extension from file'
select the path ..../YCAI/build
then pin and enable the extension from the top bar menu
```
