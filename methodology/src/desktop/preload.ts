// this file should be used to define the server API exposed to the client

import { contextBridge, ipcRenderer } from 'electron';

// eslint-disable-next-line no-console
console.log({ contextBridge, ipcRenderer });
// eslint-disable-next-line no-console
console.log(global.Electron);

// contextBridge.exposeInMainWorld("electron", {
//   doThing: () => ipcRenderer.send("do-a-thing"),
// });
