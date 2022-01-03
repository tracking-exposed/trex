import { app, BrowserWindow, ipcMain, session } from "electron";
import * as path from "path";
import puppeteer from "puppeteer-core";
import pie from "puppeteer-in-electron";
import * as guardoni from "../guardoni";
import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import { sequenceS } from "fp-ts/lib/Apply";
import log from "electron-log";

let mainWindow: BrowserWindow | null = null;

const mainWindowHTML = `file://${path.join(
  __dirname,
  "renderer/guardoni.html"
)}`;

const creatMainWindow = (): TE.TaskEither<Error, BrowserWindow> => {
  return TE.tryCatch(async () => {
    mainWindow = new BrowserWindow({
      width: 1000,
      height: 800,
      fullscreenable: false,
      resizable: false,
      autoHideMenuBar: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
    });

    await mainWindow.loadURL(mainWindowHTML);
    mainWindow.on("closed", function () {
      mainWindow = null;
    });
    return mainWindow;
  }, E.toError);
};

const createGuardoniWindow = (
  app: Electron.App,
  parentWindow: BrowserWindow
): TE.TaskEither<
  Error,
  { browser: puppeteer.Browser; window: BrowserWindow }
> => {
  return TE.tryCatch(async () => {
    const browser = await pie.connect(app, puppeteer);

    const window = new BrowserWindow({
      autoHideMenuBar: true,
      show: false,
      parent: parentWindow,
    });

    return { browser, window };
  }, E.toError);
};

export const run = async (): Promise<void> => {
  log.info("Guardoni start", process.cwd());
  app.setPath("userData", path.resolve(process.cwd(), "data"));

  await pie.initialize(app);

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  app.on("ready", async () => {
    return pipe(
      creatMainWindow(),
      TE.chain((win) => createGuardoniWindow(app, win)),
      TE.chain((guardoniApp) => {
        return pipe(
          sequenceS(TE.ApplicativeSeq)({
            loadExtension: TE.tryCatch(
              () =>
                session.defaultSession.loadExtension(
                  path.join(__dirname, "../extension")
                ),
              E.toError
            ),
            runGuardoni: TE.tryCatch(async () => {
              // eslint-disable-next-line @typescript-eslint/no-misused-promises
              ipcMain.on("startGuardoni", async (event, args) => {
                const profile = args.profileName ?? "default";
                const evidenceTag = args.evidenceTag ?? "no-tag";

                const experiment = "d75f9eaf465d2cd555de65eaf61a770c82d59451";

                // eslint-disable-next-line no-console
                log.info("Starting guardoni with", { profile, evidenceTag });

                const profileData = await guardoni.profileExecount(
                  profile,
                  evidenceTag
                );

                // eslint-disable-next-line no-console
                log.info(profileData);

                const directivesURL = guardoni.buildAPIurl(
                  "directives",
                  experiment
                );

                const directives = await guardoni.pullDirectives(directivesURL);

                // eslint-disable-next-line no-console
                log.info({ directives });

                await guardoniApp.window.show();

                const page = await pie.getPage(
                  guardoniApp.browser,
                  guardoniApp.window
                );
                await guardoni.guardoniExecution(
                  experiment,
                  directives,
                  page,
                  profileData
                );

                await guardoniApp.window.destroy();
              });
            }, E.toError),
          }),
          TE.mapLeft((e) => {
            log.error('An error occured ', e);
            guardoniApp.window.emit("guardoniError", e);
            return e;
          })
        );
      })
    )();

    // return undefined;
  });
};

// eslint-disable-next-line no-console
void run().catch(console.error);
