import { ipcRenderer } from "electron";

const showName = document.getElementById("showName");
ipcRenderer.on("forWin2", function (event, arg) {
  console.log(arg);
  if (showName) {
    showName.innerHTML = arg;
  }
});
console.log("I'm Window2");
