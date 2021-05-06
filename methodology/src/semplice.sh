#!/bin/sh -x
source=json/fish-control-1.json DEBUG=*,-puppeteer* experiment=meto8 src/guardoni.js ;
sleep 10;
source=json/smol.json DEBUG=*,-puppeteer* experiment=meto8 src/guardoni.js ;
sleep 10;
source=json/training1.json DEBUG=*,-puppeteer* experiment=meto8 src/guardoni.js ;
sleep 30;
source=json/fish-control-2.json DEBUG=*,-puppeteer* experiment=meto8 src/guardoni.js 
