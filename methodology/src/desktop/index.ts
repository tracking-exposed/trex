import { BrowserWindow, app, ipcMain } from "electron";
import * as path from "path";
import * as pie from "./electron-puppeteer";
import * as puppeteer from "puppeteer-core";
import electronReload from "electron-reload";

const electronExecPath = path.resolve(
  __dirname,
  "../../../",
  "node_modules",
  "electron",
  "dist",
  "electron"
);

electronReload(path.resolve(process.cwd(), "build"), {
  electron: electronExecPath,
});

const startGuardoni = async (): Promise<void> => {
  // eslint-disable-next-line no-console
  console.log("start guardoni");
  const browser = await pie.connect(app, puppeteer as any);

  const window = new BrowserWindow({});
  window.webContents.openDevTools();
  const url = "https://youtube.com/";
  await window.loadURL(url);
  const [page] = await browser.pages();

  // eslint-disable-next-line no-console
  console.log(page.url());
  setTimeout(() => {
    window.destroy();
  }, 5000);
};

let mainWindow: BrowserWindow | null = null;
const mainHTMLPath = `file:${path.join(__dirname, "./guardoni.html")}`;

const creatMainWindow = async (): Promise<BrowserWindow> => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
    },
  });
  await mainWindow.loadURL(mainHTMLPath);
  mainWindow.webContents.openDevTools();
  mainWindow.on("closed", function () {
    mainWindow = null;
  });
  return mainWindow;
};

const main = async (): Promise<void> => {
  await pie.initialize(app);

  app.on("ready", () => {
    // console.log("app ready");

    void creatMainWindow();

    ipcMain.on("StartGuardoni", () => {
      void startGuardoni();
    });

    return undefined;
  });
};

void main();
