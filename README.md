## Youtube Tracking Exposed toolkit

This repository contains four directories:

* YCAI: the browser extension for [YouChoose.AI](https://youchoose.ai) and react component of [studio.youchoose.ai](https://studio.youchoose.ai)
* extension: the browser extension of [youtube.tracking.exposed](https://youtube.tracking.exposed) the youtube algorithm analysis toolkit for researcher, power user, and algorithm analysts.
* backend: the express+mongodb server that process data donation from YouChoose and yttrex browser extension.
* methodology: a complet pupetteer wrapper to orchestrate repetable data collection with yttrex extension, documented with the name of [Guardoni](https://youtube.tracking.exposed/guardoni).

### HOW TO rebuild YouChoose.AI browser extension

    cd yttrex
    yarn
    yarn ycai built:ext
    ls YCAI/build/extension

### HOW TO rebuild youtube.tracking.exposed browser extension

    cd yttrex
    yarn
    cd extension
    npm run build:dist
    ls dist/

# Credits 

### Backend package

* Initialy sponsored by [ALEX](https://algorithms.exposed) from University of Amsterdam DATACTIVE reseaerch group
* Maintain by the Technical team of [Tracking Exposed](https://tracking.exposed), more details on [youtube.tracking.exposed](https://youtube.tracking.exposed).

### Methodology

* Maintain by the Technical and Research team of [Tracking Exposed](https://tracking.exposed), more details on [youtube.tracking.exposed](https://youtube.tracking.exposed).

### YCAI

* Sponsored by the European Commission Ledger project in 2021, Develope by the technical team of [YouChoose AI](https://youchoose.ai) a project by Tracking Exposed. It is listed separately as we **consider YouChoose should develop its own governance**, reach out to us if you want to know more.

### Extension package

* Maintain by the Technical team of [Tracking Exposed](https://tracking.exposed), more details on [youtube.tracking.exposed](https://youtube.tracking.exposed).
* Based on the contribution of [@vrde](https://github.com/vrde).

# License

Affero-GPL 3, as file attached in this repository display.
