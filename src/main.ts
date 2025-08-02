import { app, BrowserWindow } from "electron";
import registerListeners from "./helpers/ipc/listeners-register";
import { cleanupTerminals } from "./helpers/ipc/terminal/terminal-listeners";
import { createApplicationMenu } from "./helpers/application-menu/menu-setup";
// "electron-squirrel-startup" seems broken when packaging with vite
//import started from "electron-squirrel-startup";
import path from "path";
import {
  installExtension,
  REACT_DEVELOPER_TOOLS,
} from "electron-devtools-installer";

const inDevelopment = process.env.NODE_ENV === "development";

function createWindow() {
  const { screen } = require("electron");
  const fs = require("fs");
  const userDataPath = app.getPath("userData");
  const windowStatePath = path.join(userDataPath, "window-state.json");

  let windowState = null;
  try {
    if (fs.existsSync(windowStatePath)) {
      windowState = JSON.parse(fs.readFileSync(windowStatePath, "utf8"));
    }
  } catch (e) {
    windowState = null;
  }

  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  const preload = path.join(__dirname, "preload.js");
  const mainWindow = new BrowserWindow({
    width: windowState?.width || width,
    height: windowState?.height || height,
    x: windowState?.x ?? primaryDisplay.workArea.x,
    y: windowState?.y ?? primaryDisplay.workArea.y,
    webPreferences: {
      devTools: true,
      // devTools: inDevelopment,
      contextIsolation: true,
      nodeIntegration: true,
      nodeIntegrationInSubFrames: false,
      webSecurity: false,
      preload: preload,
    },
    vibrancy: 'fullscreen-ui',    // on MacOS
    backgroundMaterial: 'acrylic', // on Windows 11
    transparent: true,
    frame: false,
    titleBarStyle: "default",
  });

  // Save window size/position on close
  mainWindow.on("close", () => {
    const bounds = mainWindow.getBounds();
    try {
      fs.writeFileSync(windowStatePath, JSON.stringify(bounds));
    } catch (e) {
      // ignore
    }
  });

  registerListeners(mainWindow);

  // Set up application menu
  createApplicationMenu();

  // Initialize auto-updater for production builds using update-electron-app
  // DISABLED CAUSE I GOT NO CODE SIGNING CERTIFICATE
  // if (!inDevelopment) {
  //   const { updateElectronApp } = require('update-electron-app');
  //   updateElectronApp({
  //     repo: 'vibe-stack/vcode',
  //     updateInterval: '1 hour',
  //     logger: require('electron-log')
  //   });
  // }

  // Let the renderer process keymap system handle Cmd+W entirely
  // It will close tabs when available and prevent app closure when appropriate

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }
}

async function installExtensions() {
  try {
    const result = await installExtension(REACT_DEVELOPER_TOOLS);
    console.log(`Extensions installed successfully: ${result.name}`);
  } catch {
    console.error("Failed to install extensions");
  }
}

app.whenReady().then(createWindow).then(installExtensions);

//osX only
app.on("window-all-closed", () => {
  cleanupTerminals();
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on("before-quit", () => {
  cleanupTerminals();
});
//osX only ends
