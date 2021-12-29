import { BrowserWindow, app, ipcMain, session } from "electron";
import * as path from "path";
import pie from "puppeteer-in-electron";
import puppeteer from "puppeteer-core";
import * as guardoni from "../guardoni";

let mainWindow: BrowserWindow | null = null;

const mainWindowHTML= `file://${path.join(__dirname, 'renderer/guardoni.html')}`;
const creatMainWindow = async (): Promise<BrowserWindow> => {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    fullscreenable: false,
    resizable: false,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      devTools: true,
    },
  });
  await mainWindow.loadURL(mainWindowHTML);
  mainWindow.on("closed", function () {
    mainWindow = null;
  });
  return mainWindow;
};

const createGuardoniWindow = async (
  app: Electron.App,
  parentWindow: BrowserWindow
): Promise<{ browser: puppeteer.Browser; window: BrowserWindow }> => {
  const browser = await pie.connect(app, puppeteer);

  const window = new BrowserWindow({
    autoHideMenuBar: true,
    show: false,
    parent: parentWindow,
  });
  return { browser, window };
};

export const run = async (): Promise<void> => {
  app.setPath("userData", path.resolve(process.cwd(), "output"));

  await pie.initialize(app);

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  app.on("ready", async () => {
    const mainWindow = await creatMainWindow();
    const guardoniApp = await createGuardoniWindow(app, mainWindow);

    await session.defaultSession.loadExtension(
      path.join(process.cwd(), "./extension")
    );
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    ipcMain.on("startGuardoni", async (event, args) => {
      const profile = args.profileName ?? "default";
      const evidenceTag = args.evidenceTag ?? "no-tag";

      const experiment = "d75f9eaf465d2cd555de65eaf61a770c82d59451";

      // eslint-disable-next-line no-console
      console.log("Starting guardoni with", { profile, evidenceTag });

      try {
        const profileData = await guardoni.profileExecount(
          profile,
          evidenceTag
        );

        // eslint-disable-next-line no-console
        console.log(profileData);

        const directivesURL = guardoni.buildAPIurl("directives", experiment);

        const directives = await guardoni.pullDirectives(directivesURL);

        // eslint-disable-next-line no-console
        console.log({ directives });

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
        // eslint-disable-next-line no-console
        console.error(e);
      }
    });

    // return undefined;
  });
};

void run().catch(console.error);
