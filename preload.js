const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  selectFiles: () => ipcRenderer.invoke("select-files"),
  processDiff: (file1, file2) =>
    ipcRenderer.invoke("process-diff", file1, file2),
  processInputDiff: (sql1, sql2) =>
    ipcRenderer.invoke("process-input-diff", sql1, sql2),
  readFile: (filePath) => ipcRenderer.invoke("read-file", filePath),
});
