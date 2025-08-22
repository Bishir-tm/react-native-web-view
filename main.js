const { app, BrowserWindow } = require("electron");
const createServer = require("./index");

let mainWindow;
let server;

function createWindow() {
  // Start the Express server
  const { server: app, port } = createServer();
  server = app;

  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  mainWindow.loadURL(`http://localhost:${port}/index.html`);

  mainWindow.on("closed", () => {
    mainWindow = null;
    if (server) {
      server.close();
    }
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (server) {
    server.close();
  }
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
