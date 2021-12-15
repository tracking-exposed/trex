import { App } from "electron";
import puppeteer, { Browser } from "puppeteer";

/**
 * Initialize the electron app to accept puppeteer/DevTools connections.
 * Must be called at startup before the electron app is ready.
 * @param {App} app The app imported from electron.
 * @param {number} port Port to host the DevTools websocket connection.
 */
 export const initialize = async (app: App, port: number = 0): Promise<void> => {
  if (!app) {
    throw new Error("The parameter 'app' was not passed in. " +
      "This may indicate that you are running in node rather than electron.");
  }

  if (app.isReady()) {
    throw new Error("Must be called at startup before the electron app is ready.");
  }

  if (port < 0 || port > 65535) {
    throw new Error(`Invalid port ${port}.`);
  }

  if (app.commandLine.getSwitchValue("remote-debugging-port")) {
    throw new Error("The electron application is already listening on a port. Double `initialize`?");
  }

  // const actualPort = port === 0 ? await getPort({host: "127.0.0.1"}) : port;
  // app.commandLine.appendSwitch(
  //   "remote-debugging-port",
  //   `${actualPort}`
  // );
  app.commandLine.appendSwitch(
    "remote-debugging-address",
    "127.0.0.1"
  );
  const electronMajor = parseInt(
    app.getVersion().split(".")[0],
    10
  );
    // NetworkService crashes in electron 6.
  if (electronMajor >= 7) {
    app.commandLine.appendSwitch(
      "enable-features",
      "NetworkService"
    );
  }
};

/**
 * Connects puppeteer to the electron app. Must call {@link initialize} before connecting.
 * When connecting multiple times, you use the same port.
 * @param {App} app The app imported from electron.
 * @param {puppeteer} puppeteer The imported puppeteer namespace.
 * @returns {Promise<Browser>} An object containing the puppeteer browser, the port, and json received from DevTools.
 */
export const connect = async (
  app: App,
  puppeteer: puppeteer.PuppeteerNode
): Promise<Browser> => {
  if (!puppeteer) {
    throw new Error("The parameter 'puppeteer' was not passed in.");
  }

  await app.whenReady();

  const browser = await puppeteer.launch({
    defaultViewport: null,
    headless: true,
    userDataDir: undefined,
    args: [],
    executablePath: "/usr/bin/google-chrome",
  });

  return browser;
};
