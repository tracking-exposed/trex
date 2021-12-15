import { ipcRenderer } from "electron";
import React from "react";
import ReactDOM from "react-dom";


const startGuardoni = async () => {
  ipcRenderer.send('StartGuardoni', { type: 'StartGuardoni' });
};

ReactDOM.render(
  <React.StrictMode>
    <div>
      <button
        onClick={() => {
          void startGuardoni();
        }}
      >
        Start guardoni
      </button>
    </div>
  </React.StrictMode>,
  document.getElementById("configuration")
);

console.log("configuration window");
