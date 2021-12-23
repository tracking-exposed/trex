import { BrowserWindow, app, ipcMain } from "electron";
import * as path from "path";
import pie from "puppeteer-in-electron";
import puppeteer from "puppeteer-core";
import * as guardoni from "../guardoni";

let mainWindow: BrowserWindow | null = null;
const mainHTMLPath = `file:${path.join(__dirname, "./guardoni.html")}`;

const creatMainWindow = async (): Promise<BrowserWindow> => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  await mainWindow.loadURL(mainHTMLPath);
  mainWindow.webContents.openDevTools();
  mainWindow.on("closed", function () {
    mainWindow = null;
  });
  return mainWindow;
};

const createGuardoniWindow = async (
  app: Electron.App,
  parentWindow: BrowserWindow
): Promise<{ browser: puppeteer.Browser; window: BrowserWindow }> => {
  console.log("initialize pup", app);
  console.log("pup", puppeteer);
  const browser = await pie.connect(app, puppeteer);

  const window = new BrowserWindow({
    frame: false,
    show: false,
    parent: parentWindow,
  });
  return { browser, window };
};

export const run = async (): Promise<void> => {
  app.setPath("userData", path.resolve(process.cwd(), "output"));

  await pie.initialize(app, 5533);

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  app.on("ready", async () => {
    const mainWindow = await creatMainWindow();
    const guardoniApp = await createGuardoniWindow(app, mainWindow);

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    ipcMain.on("startGuardoni", async (event, args) => {
      const profile = args.profileName ?? 'default';
      const evidenceTag = args.evidenceTag ?? 'no-tag';

      const experiment = "d75f9eaf465d2cd555de65eaf61a770c82d59451";
      console.log("star this", { event, args });

      try {
        const profileData = await guardoni.profileExecount(
          profile,
          evidenceTag
        );

        console.log(profileData);

        const directivesURL = guardoni.buildAPIurl("directives", experiment);

        console.log({ directivesURL });

        const directives = await guardoni.pullDirectives(directivesURL);

        console.log({ directives })

        await guardoniApp.window.show();

        const page = await pie.getPage(guardoniApp.browser, guardoniApp.window);
        await guardoni.guardoniExecution(
          experiment,
          directives,
          page,
          profileData
        );

        await guardoniApp.window.destroy();
      } catch (e) {
        console.error(e);
      }
    });

    // return undefined;
  });
};

void run();
