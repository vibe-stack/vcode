import { Menu, BrowserWindow, app, dialog } from 'electron';
import path from 'path';
import {
  MENU_NEW_FILE_CHANNEL,
  MENU_NEW_WINDOW_CHANNEL,
  MENU_OPEN_FOLDER_CHANNEL,
  MENU_SAVE_FILE_CHANNEL,
  MENU_SAVE_AS_FILE_CHANNEL,
  MENU_CLOSE_WINDOW_CHANNEL
} from './menu-channels';

export function createApplicationMenu() {
  const isMac = process.platform === 'darwin';

  const template: Electron.MenuItemConstructorOptions[] = [
    // App Menu (macOS only)
    ...(isMac ? [{
      label: app.getName(),
      submenu: [
        { role: 'about' as const },
        { type: 'separator' as const },
        { role: 'services' as const },
        { type: 'separator' as const },
        { role: 'hide' as const },
        { role: 'hideOthers' as const },
        { role: 'unhide' as const },
        { type: 'separator' as const },
        { role: 'quit' as const }
      ]
    }] : []),

    // File Menu
    {
      label: 'File',
      submenu: [
        {
          label: 'New File',
          accelerator: 'CmdOrCtrl+N',
          click: (menuItem, browserWindow) => {
            if (browserWindow && browserWindow instanceof BrowserWindow) {
              browserWindow.webContents.send(MENU_NEW_FILE_CHANNEL);
            }
          }
        },
        {
          label: 'New Window',
          accelerator: 'CmdOrCtrl+Shift+N',
          click: () => {
            createNewWindow();
          }
        },
        { type: 'separator' },
        {
          label: 'Open Folder...',
          accelerator: 'CmdOrCtrl+O',
          click: async (menuItem, browserWindow) => {
            if (browserWindow && browserWindow instanceof BrowserWindow) {
              const result = await dialog.showOpenDialog(browserWindow, {
                properties: ['openDirectory']
              });
              
              if (!result.canceled && result.filePaths.length > 0) {
                const folderPath = result.filePaths[0];
                // Navigate to workspace with the selected folder
                const baseUrl = browserWindow.webContents.getURL().split('?')[0];
                const newUrl = `${baseUrl}?project=${encodeURIComponent(folderPath)}`;
                browserWindow.webContents.loadURL(newUrl);
              }
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: (menuItem, browserWindow) => {
            if (browserWindow && browserWindow instanceof BrowserWindow) {
              browserWindow.webContents.send(MENU_SAVE_FILE_CHANNEL);
            }
          }
        },
        {
          label: 'Save As...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: (menuItem, browserWindow) => {
            if (browserWindow && browserWindow instanceof BrowserWindow) {
              browserWindow.webContents.send(MENU_SAVE_AS_FILE_CHANNEL);
            }
          }
        },
        { type: 'separator' },
        {
          label: isMac ? 'Close Window' : 'Exit',
          accelerator: isMac ? 'Cmd+W' : 'Alt+F4',
          click: (menuItem, browserWindow) => {
            if (browserWindow && browserWindow instanceof BrowserWindow) {
              if (isMac) {
                browserWindow.close();
              } else {
                app.quit();
              }
            }
          }
        }
      ]
    },

    // Edit Menu
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        ...(isMac ? [
          { role: 'pasteAndMatchStyle' as const },
          { role: 'delete' as const },
          { role: 'selectAll' as const },
          { type: 'separator' as const },
          {
            label: 'Speech',
            submenu: [
              { role: 'startSpeaking' as const },
              { role: 'stopSpeaking' as const }
            ]
          }
        ] : [
          { role: 'delete' as const },
          { type: 'separator' as const },
          { role: 'selectAll' as const }
        ])
      ]
    },

    // View Menu
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },

    // Window Menu
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' },
        ...(isMac ? [
          { type: 'separator' as const },
          { role: 'front' as const },
          { type: 'separator' as const },
          { role: 'window' as const }
        ] : [
          { role: 'close' as const }
        ])
      ]
    },

    // Help Menu
    {
      role: 'help',
      submenu: [
        {
          label: 'Learn More',
          click: async () => {
            const { shell } = require('electron');
            await shell.openExternal('https://electronjs.org');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createNewWindow() {
  // Get the current window to copy its configuration
  const currentWindow = BrowserWindow.getFocusedWindow();
  const { screen } = require('electron');
  const fs = require('fs');

  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  const preload = path.join(__dirname, "preload.js");

  const newWindow = new BrowserWindow({
    width: width * 0.8,
    height: height * 0.8,
    webPreferences: {
      devTools: true,
      contextIsolation: true,
      nodeIntegration: true,
      nodeIntegrationInSubFrames: false,
      webSecurity: false,
      preload: preload,
    },
    vibrancy: 'fullscreen-ui',
    backgroundMaterial: 'acrylic',
    transparent: true,
    frame: false,
    titleBarStyle: "default",
  });

  // Load the same URL as the current window, but without project parameter
  if (currentWindow) {
    const currentUrl = currentWindow.webContents.getURL();
    const baseUrl = currentUrl.split('?')[0];
    newWindow.loadURL(baseUrl);
  } else {
    // Fallback if no current window
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
      newWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    } else {
      newWindow.loadFile(
        path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
      );
    }
  }

  // Register listeners for the new window
  const registerListeners = require('../ipc/listeners-register').default;
  registerListeners(newWindow);

  return newWindow;
}
