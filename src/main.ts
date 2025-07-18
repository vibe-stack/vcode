import { app, BrowserWindow, screen } from "electron";
import registerListeners from "./helpers/ipc/listeners-register";
import { cleanupTerminals } from "./helpers/ipc/terminal/terminal-listeners";
import { ExtensionManagerMain } from "./services/extension-manager-main";
// "electron-squirrel-startup" seems broken when packaging with vite
//import started from "electron-squirrel-startup";
import path from "path";
import {
  installExtension,
  REACT_DEVELOPER_TOOLS,
} from "electron-devtools-installer";

const inDevelopment = process.env.NODE_ENV === "development";

function createWindow() {
  const preload = path.join(__dirname, "preload.js");
  
  // Get the primary display and calculate 60% width and 80% height
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
  const windowWidth = Math.floor(screenWidth * 0.6);
  const windowHeight = Math.floor(screenHeight * 0.8);
  
  const mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    webPreferences: {
      devTools: inDevelopment,
      contextIsolation: true,
      nodeIntegration: true,
      nodeIntegrationInSubFrames: false,
      webSecurity: false,
      preload: preload,
    },
    frame: true,
  });
  console.log('🚀 Registering IPC listeners including MCP...')
  registerListeners(mainWindow);
  console.log('✅ IPC listeners registered successfully')

  // Initialize extension manager
  console.log('🔌 Initializing Extension Manager...')
  new ExtensionManagerMain();
  console.log('✅ Extension Manager initialized')

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
