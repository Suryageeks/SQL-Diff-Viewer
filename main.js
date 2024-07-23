const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const { diffLines } = require("diff");

// Create the main window
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile("index.html");
}

ipcMain.handle("select-files", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile", "multiSelections"],
    filters: [{ name: "SQL Files", extensions: ["sql"] }],
  });
  return result.filePaths;
});

ipcMain.handle("read-file", async (event, filePath) => {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    // console.log(`Read file ${filePath}:`, content);
    return content;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return "";
  }
});

ipcMain.handle("process-diff", async (event, file1, file2) => {
  const sql1 = fs.readFileSync(file1, "utf8");
  const sql2 = fs.readFileSync(file2, "utf8");

  const differences = diffLines(sql1, sql2);
  let htmlResult =
    "<html><head><style>body{font-family: monospace; white-space: pre;}.added{background-color: #d4f4d4;}.removed{background-color: #f4d4d4;}.unchanged{background-color: #f0f0f0;}</style></head><body>";

  differences.forEach((part) => {
    const lines = part.value.split(/\r?\n/);
    lines.forEach((line) => {
      if (part.added) {
        if (line) htmlResult += `<div class="added">+ ${line}</div>`;
      } else if (part.removed) {
        if (line) htmlResult += `<div class="removed">- ${line}</div>`;
      } else {
        if (line) htmlResult += `<div class="unchanged">${line}</div>`;
      }
    });
  });

  htmlResult += "</body></html>";
  const tmpFilePath = path.join(require("os").tmpdir(), "sql-diff-output.html");
  fs.writeFileSync(tmpFilePath, htmlResult);

  return tmpFilePath;
});

ipcMain.handle("process-input-diff", async (event, sql1, sql2) => {
  const differences = diffLines(sql1, sql2);
  let htmlResult =
    "<html><head><style>body{font-family: monospace; white-space: pre;}.added{background-color: #d4f4d4;}.removed{background-color: #f4d4d4;}.unchanged{background-color: #f0f0f0;}</style></head><body>";

  differences.forEach((part) => {
    const lines = part.value.split(/\r?\n/); // Split by newline
    lines.forEach((line) => {
      if (part.added) {
        if (line) htmlResult += `<div class="added">+ ${line}</div>`;
      } else if (part.removed) {
        if (line) htmlResult += `<div class="removed">- ${line}</div>`;
      } else {
        if (line) htmlResult += `<div class="unchanged">${line}</div>`;
      }
    });
  });

  htmlResult += "</body></html>";
  const tmpFilePath = path.join(require("os").tmpdir(), "sql-diff-output.html");
  fs.writeFileSync(tmpFilePath, htmlResult);

  return tmpFilePath;
});

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
