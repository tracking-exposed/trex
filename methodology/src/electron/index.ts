import { BrowserWindow, app, ipcMain } from "electron";
import * as path from "path";
import * as pie from "./electron-puppeteer";
import puppeteer from "puppeteer-core";

const electronExecPath = path.resolve(
  process.cwd(),
  "node_modules",
  "electron",
  "dist",
  "electron"
);

require("electron-reload")(path.resolve(process.cwd(), "build"), {
  electron: electronExecPath,
});

const startGuardoni = async () => {
  console.log('start guardoni');
  const browser = await pie.connect(app, puppeteer as any);

  const window = new BrowserWindow({});
  const url = "https://youtube.com/";
  await window.loadURL(url);
  const [page] = await browser.pages();

  setTimeout(() => {
    window.destroy();
  }, 5000);
};

let mainWindow: BrowserWindow | null = null;
const mainHTMLPath = `file:${path.join(__dirname, "./configuration.html")}`;

const creatMainWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      // preload: path.resolve(__dirname, "./preload.js"),
    },
  });
  mainWindow.loadURL(mainHTMLPath);
  mainWindow.webContents.openDevTools();
  mainWindow.on("closed", function () {
    mainWindow = null;
  });
  return mainWindow;
};

const main = async () => {
  await pie.initialize(app);
  app.on("ready", async () => {
    console.log("app ready");

    const mainWindow = creatMainWindow();

    ipcMain.on("StartGuardoni", async () => {
      await startGuardoni();
    });
    // ipcMain.on("startGuardoni", (event, arg) => {
    // console.log("name inside main process is: ", arg); // this comes form within window 1 -> and into the mainProcess
    // event.sender.send("nameReply", { not_right: false }); // sends back/replies to window 1 - "event" is a reference to this chanel.
    // window2.webContents.send("forWin2", arg);
    // });
  });
};

main();
